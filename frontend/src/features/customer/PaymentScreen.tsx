import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, CheckCircle2, CreditCard, Printer, ShieldCheck, XCircle, Receipt, BadgeCheck,
} from 'lucide-react';
import { bookingApi, paymentApi, vehicleApi, getErrorMessage } from '@/lib/api';
import { toast } from '@/stores/toast-store';
import { useAuthStore } from '@/stores/auth-store';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CreateOrderResponse } from '@/types';
import { Button } from '@/components/ui/Button';
import { CardSkeleton, ErrorState } from '@/components/ui/Feedback';

// ── Razorpay Checkout SDK (loaded from https://checkout.razorpay.com/v1/checkout.js) ──

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number; // paise
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  handler?: (response: RazorpayResponse) => void;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: unknown) => void) => void;
}

interface RazorpayConstructor {
  new (options: RazorpayOptions): RazorpayInstance;
}

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

const RAZORPAY_CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${RAZORPAY_CHECKOUT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Could not load Razorpay checkout')));
      return;
    }
    const script = document.createElement('script');
    script.src = RAZORPAY_CHECKOUT_SRC;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load Razorpay checkout — check your connection'));
    document.body.appendChild(script);
  });
}

type PayState =
  | { phase: 'idle' }
  | { phase: 'initializing' }
  | { phase: 'success'; paymentId: number | null; gatewayId: string | null; method: string | null }
  | { phase: 'failed' };

export function PaymentScreen() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const id = Number(bookingId);
  const user = useAuthStore((s) => s.user);
  const [payState, setPayState] = useState<PayState>({ phase: 'idle' });
  // Guards the modal-ondismiss cancel call: once the payment handler has run,
  // the payment is being verified — never cancel it afterwards.
  const paymentSubmittedRef = useRef(false);

  const { data: booking, isLoading, isError, refetch } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingApi.get(id),
    enabled: Number.isFinite(id),
  });

  const { data: vehicles } = useQuery({
    queryKey: ['my-vehicles'],
    queryFn: vehicleApi.getMyVehicles,
    enabled: Number.isFinite(id) && (booking?.status === 'PAID' || payState.phase === 'success'),
  });

  if (isLoading) return <CardSkeleton count={2} />;
  if (isError || !booking) return <ErrorState message="Could not load booking" onRetry={() => refetch()} />;

  const amount = booking.finalAmount ?? booking.estimatedAmount ?? 0;
  const isPaid = booking.status === 'PAID';
  const vehicle = vehicles?.find((v) => v.id === booking.vehicleId);

  const handlePay = async () => {
    if (!window.Razorpay) {
      toast('Loading payment gateway…', 'info');
    }
    setPayState({ phase: 'initializing' });
    try {
      await loadRazorpayScript();

      // 1. Create the Razorpay order on the backend — the amount is resolved
      //    server-side from the booking's final amount, never from the client.
      const order: CreateOrderResponse = await paymentApi.createOrder(booking.id);

      // 2. Open the Razorpay Checkout
      const razorpay = new window.Razorpay!({
        key: order.razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: 'AutoCare',
        description: `${booking.serviceType} · Booking #${booking.id}`,
        order_id: order.razorpayOrderId,
        prefill: user?.name ? { name: user.name } : undefined,
        theme: { color: '#f59e0b' },
        handler: async (response) => {
          // 3. Customer paid — verify the signature on the backend
          paymentSubmittedRef.current = true;
          setPayState({ phase: 'initializing' });
          try {
            const result = await paymentApi.verifyOrder({
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            });              if (result.success) {
                setPayState({
                  phase: 'success',
                  paymentId: result.paymentId,
                  gatewayId: result.transactionId,
                  method: result.paymentMethod,
                });
              toast('Payment successful!', 'success');
              void refetch();
            } else {
              setPayState({ phase: 'failed' });
              toast('Payment could not be confirmed — please try again', 'error');
            }
          } catch (err) {
            toast(getErrorMessage(err), 'error');
            setPayState({ phase: 'failed' });
          }
        },
        modal: {
          ondismiss: () => {
            if (paymentSubmittedRef.current) return; // payment already submitted — never cancel it
            // Customer closed the checkout without paying — close the pending
            // transaction server-side so the booking can be retried later.
            void paymentApi
              .verifyOrder({ razorpayPaymentId: '', razorpayOrderId: order.razorpayOrderId, razorpaySignature: '' })
              .catch(() => undefined)
              .finally(() => {
                setPayState({ phase: 'idle' });
                void refetch();
              });
          },
        },
      });
      razorpay.on('payment.failed', () => {
        setPayState({ phase: 'failed' });
        toast('Payment failed — you can retry', 'error');
        void refetch();
      });
      razorpay.open();
      setPayState({ phase: 'idle' });
    } catch (err) {
      toast(getErrorMessage(err), 'error');
      setPayState({ phase: 'idle' });
    }
  };

  // ── Already paid ─────────────────────────────────────────────────────
  if (isPaid) {
    return (
      <div className="mx-auto max-w-lg py-10">
        <div className="card p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-extrabold text-ink-900 dark:text-ink-100">Payment already completed</h1>
          <p className="mt-2 text-sm text-ink-500">
            {booking.serviceType} · Booking #{booking.id} was paid {booking.finalAmount != null && `· ${formatCurrency(booking.finalAmount)}`}.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/dashboard/bookings"><Button variant="outline">Back to bookings</Button></Link>
            <Link to="/dashboard/payments"><Button>View payments</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Success view ─────────────────────────────────────────────────────
  if (payState.phase === 'success') {
    const invoiceNo = `AC-INV-${String(booking.id).padStart(6, '0')}`;
    return (
      <div className="mx-auto max-w-lg py-10">
        <div className="card p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-extrabold text-ink-900 dark:text-ink-100">Payment Successful ✓</h1>
          <p className="mt-1 text-sm text-ink-500">Booking #{booking.id} · {booking.serviceType}</p>

          <div className="mt-6 space-y-3 rounded-2xl bg-ink-50 p-5 text-left dark:bg-ink-800/50">
            <div className="flex justify-between text-sm">
              <span className="text-ink-500">Amount paid</span>
              <span className="font-bold text-ink-900 dark:text-ink-100">{formatCurrency(amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-500">Payment method</span>
              <span className="font-semibold text-ink-900 dark:text-ink-100">{payState.method ?? 'Razorpay'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-500">Transaction ID</span>
              <span className="font-mono text-xs font-semibold text-ink-900 dark:text-ink-100">{payState.gatewayId}</span>
            </div>
            <div className="flex justify-between border-t border-ink-200 pt-3 text-xs dark:border-ink-700">
              <span className="flex items-center gap-1 text-ink-500"><Receipt className="h-3.5 w-3.5" /> AutoCare commission</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">{booking.platformCommission != null ? `− ${formatCurrency(booking.platformCommission)}` : '…'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1 text-ink-500"><BadgeCheck className="h-3.5 w-3.5" /> Mechanic earning</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{booking.mechanicEarning != null ? formatCurrency(booking.mechanicEarning) : '…'}</span>
            </div>
          </div>

          <div className="mt-6 flex justify-center gap-3">
            <Link to="/dashboard/bookings"><Button variant="outline">My bookings</Button></Link>
            <Link to="/dashboard/payments"><Button>View payments</Button></Link>
          </div>
        </div>

        {/* Invoice (print via Download Invoice) */}
        <div id="invoice" className="card mt-6 overflow-hidden">
          <div className="flex items-center justify-between border-b border-ink-100 bg-brand-50 px-6 py-4 dark:border-ink-800 dark:bg-brand-500/10">
            <div>
              <p className="text-lg font-extrabold text-brand-600 dark:text-brand-400">AutoCare</p>
              <p className="text-[11px] font-medium uppercase tracking-wider text-ink-400">Your Vehicle, Our Care</p>
            </div>
            <p className="text-xs font-semibold text-ink-500">Invoice #{invoiceNo}</p>
          </div>
          <div className="space-y-3 px-6 py-5 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-500">Customer</span>
              <span className="font-semibold text-ink-900 dark:text-ink-100">{user?.name ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-500">Vehicle</span>
              <span className="font-semibold text-ink-900 dark:text-ink-100">
                {vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.registrationNumber})` : `Vehicle #${booking.vehicleId}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-500">Service</span>
              <span className="font-semibold text-ink-900 dark:text-ink-100">{booking.serviceType}</span>
            </div>
            <div className="flex justify-between border-t border-ink-100 pt-3 dark:border-ink-800">
              <span className="font-semibold text-ink-900 dark:text-ink-100">Amount</span>
              <span className="font-bold text-ink-900 dark:text-ink-100">{formatCurrency(amount)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-ink-400">AutoCare platform commission</span>
              <span className="font-medium text-ink-600 dark:text-ink-300">{booking.platformCommission != null ? formatCurrency(booking.platformCommission) : '—'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-ink-400">Payment status</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">PAID</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-ink-400">Transaction ID</span>
              <span className="font-mono text-ink-600 dark:text-ink-300">{payState.gatewayId}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-ink-400">Date</span>
              <span className="font-medium text-ink-600 dark:text-ink-300">{formatDate(new Date().toISOString())}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Download Invoice
          </Button>
        </div>
      </div>
    );
  }

  // ── Pay form (idle / initializing / failed) ─────────────────────────
  const canPay = booking.status === 'COMPLETED';

  return (
    <div className="mx-auto max-w-2xl py-10">
      <button onClick={() => navigate(-1)} className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="text-2xl font-extrabold text-ink-900 dark:text-ink-100">Pay for your booking</h1>
      <p className="mt-1 text-sm text-ink-500">Secure payments powered by Razorpay.</p>

      {!canPay && booking.status !== 'PAID' && (
        <div className="card mt-6 p-6 text-sm text-ink-500">
          {booking.status === 'PAYMENT_PENDING'
            ? <>A payment session is already open for this booking. If you closed the Razorpay window, wait a moment and retry — otherwise the payment is being confirmed.</>
            : <>This booking is not ready for payment (status: <b>{booking.status.replace('_', ' ')}</b>). Payment opens once the service is completed.</>}
        </div>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {/* Summary */}
        <div className="card h-fit p-5">
          <h2 className="text-base font-bold text-ink-900 dark:text-ink-100">Payment Summary</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-600 dark:text-ink-300">{booking.serviceType}</span>
              <span className="font-semibold">{formatCurrency(amount)}</span>
            </div>
            {booking.finalAmount != null && booking.estimatedAmount != null && booking.finalAmount !== booking.estimatedAmount && (
              <div className="flex justify-between text-xs text-ink-400">
                <span>Estimated amount</span>
                <span>{formatCurrency(booking.estimatedAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-ink-100 pt-3 font-bold text-ink-900 dark:border-ink-800 dark:text-ink-100">
              <span>Total</span>
              <span>{formatCurrency(amount)}</span>
            </div>
            <p className="text-[11px] leading-relaxed text-ink-400">
              Price includes standard service charges. Payment is held by AutoCare and the
              mechanic's earning is released through the platform.
            </p>
          </div>
        </div>

        {/* Pay */}
        <div className="card p-5">
          <h2 className="text-base font-bold text-ink-900 dark:text-ink-100">Checkout</h2>
          <p className="mt-2 text-xs leading-relaxed text-ink-500">
            Click below to open the Razorpay secure checkout. You can pay using UPI, cards,
            net banking, wallets and more.
          </p>

          {payState.phase === 'failed' && (
            <p className="mt-3 flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-400">
              <XCircle className="h-4 w-4 shrink-0" /> Payment failed. You can try again below.
            </p>
          )}

          <Button
            className="mt-5 w-full"
            size="lg"
            loading={payState.phase === 'initializing'}
            disabled={!canPay || payState.phase === 'initializing'}
            onClick={() => void handlePay()}
          >
            <CreditCard className="h-5 w-5" /> {payState.phase === 'initializing' ? 'Preparing checkout…' : `Pay ${formatCurrency(amount)}`}
          </Button>

          <p className="mt-4 flex items-center gap-1.5 text-xs text-ink-400">
            <ShieldCheck className="h-4 w-4 text-emerald-500" /> Payments are processed and verified securely by Razorpay (test mode).
          </p>
        </div>
      </div>
    </div>
  );
}
