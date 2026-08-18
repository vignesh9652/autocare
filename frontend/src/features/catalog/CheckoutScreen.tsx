import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, ShieldCheck, CheckCircle2, XCircle, Printer } from 'lucide-react';
import { useCartStore } from '@/stores/cart-store';
import { ordersApi, paymentApi, getErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from '@/stores/toast-store';
import { formatCurrency } from '@/lib/utils';
import { CreateSparePartOrderResponse } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/Feedback';

/** Flat doorstep delivery fee charged by the platform (₹) — matches the backend. */
const DELIVERY_FEE = 80;

// ── Razorpay Checkout SDK ────────────────────────────────────────────────────

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
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
  | { phase: 'success'; paymentId: number | null; gatewayId: string | null; method: string | null; orderId: number }
  | { phase: 'failed' };

export function CheckoutScreen() {
  const { items, subtotal, clear } = useCartStore();
  const user = useAuthStore((s) => s.user);
  const [address, setAddress] = useState('');
  const [payState, setPayState] = useState<PayState>({ phase: 'idle' });
  const paymentSubmittedRef = useRef(false);

  if (items.length === 0) {
    return (
      <div className="container-app py-16">
        <EmptyState title="Nothing to check out" description="Your cart is empty." action={<Link to="/parts"><Button>Browse Parts</Button></Link>} />
      </div>
    );
  }

  const total = subtotal() + DELIVERY_FEE;

  const handlePay = async () => {
    if (address.trim().length < 8) {
      toast('Please enter a valid delivery address', 'error');
      return;
    }
    setPayState({ phase: 'initializing' });
    try {
      if (!window.Razorpay) {
        toast('Loading payment gateway…', 'info');
      }
      await loadRazorpayScript();

      // 1. Place the spare-part order (stock deducted, totals computed server-side)
      const order = await ordersApi.create({
        items: items.map((item) => ({ sparePartId: item.partId, quantity: item.quantity })),
        address: address.trim(),
      });

      // 2. Create the Razorpay order on the backend — amount resolved server-side
      const razorpayOrder: CreateSparePartOrderResponse = await paymentApi.createSparePartOrder(order.id);

      // 3. Open the Razorpay Checkout
      const razorpay = new window.Razorpay!({
        key: razorpayOrder.razorpayKeyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'AutoCare',
        description: `Spare parts · Order #${order.id}`,
        order_id: razorpayOrder.razorpayOrderId,
        prefill: user?.name ? { name: user.name } : undefined,
        theme: { color: '#f59e0b' },
        handler: async (response) => {
          // 4. Customer paid — verify the signature on the backend
          paymentSubmittedRef.current = true;
          setPayState({ phase: 'initializing' });
          try {
            const result = await paymentApi.verifyOrder({
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            });
            if (result.success) {
              setPayState({
                phase: 'success',
                paymentId: result.paymentId,
                gatewayId: result.transactionId,
                method: result.paymentMethod,
                orderId: order.id,
              });
              clear();
              toast('Payment successful! Your order is confirmed.', 'success');
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
            if (paymentSubmittedRef.current) return;
            // Customer closed the checkout without paying
            void paymentApi
              .verifyOrder({ razorpayPaymentId: '', razorpayOrderId: razorpayOrder.razorpayOrderId, razorpaySignature: '' })
              .catch(() => undefined)
              .finally(() => {
                setPayState({ phase: 'idle' });
              });
          },
        },
      });
      razorpay.on('payment.failed', () => {
        setPayState({ phase: 'failed' });
        toast('Payment failed — you can retry', 'error');
      });
      razorpay.open();
      setPayState({ phase: 'idle' });
    } catch (err) {
      toast(getErrorMessage(err), 'error');
      setPayState({ phase: 'idle' });
    }
  };

  // ── Success view ─────────────────────────────────────────────────────
  if (payState.phase === 'success') {
    const invoiceNo = `AC-SP-${String(payState.orderId).padStart(6, '0')}`;
    return (
      <div className="container-app py-10">
        <div className="mx-auto max-w-lg">
          <div className="card p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="text-xl font-extrabold text-ink-900 dark:text-ink-100">Payment Successful ✓</h1>
            <p className="mt-1 text-sm text-ink-500">Order #{payState.orderId} · Spare Parts</p>

            <div className="mt-6 space-y-3 rounded-2xl bg-ink-50 p-5 text-left dark:bg-ink-800/50">
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">Amount paid</span>
                <span className="font-bold text-ink-900 dark:text-ink-100">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">Payment method</span>
                <span className="font-semibold text-ink-900 dark:text-ink-100">{payState.method ?? 'Razorpay'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">Transaction ID</span>
                <span className="font-mono text-xs font-semibold text-ink-900 dark:text-ink-100">{payState.gatewayId}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-3">
              <Link to="/dashboard/orders"><Button variant="outline">My Orders</Button></Link>
              <Link to="/dashboard/payments"><Button>View Payments</Button></Link>
            </div>
          </div>

          {/* Invoice */}
          <div id="invoice" className="card mt-6 overflow-hidden">
            <div className="flex items-center justify-between border-b border-ink-100 bg-brand-50 px-6 py-4 dark:border-ink-800 dark:bg-brand-500/10">
              <div>
                <p className="text-lg font-extrabold text-brand-600 dark:text-brand-400">AutoCare</p>
                <p className="text-[11px] font-medium uppercase tracking-wider text-ink-400">Spare Parts Order</p>
              </div>
              <p className="text-xs font-semibold text-ink-500">Invoice #{invoiceNo}</p>
            </div>
            <div className="space-y-3 px-6 py-5 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-500">Customer</span>
                <span className="font-semibold text-ink-900 dark:text-ink-100">{user?.name ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Order</span>
                <span className="font-semibold text-ink-900 dark:text-ink-100">#{payState.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Items</span>
                <span className="font-semibold text-ink-900 dark:text-ink-100">{items.length} part(s)</span>
              </div>
              <div className="flex justify-between border-t border-ink-100 pt-3 dark:border-ink-800">
                <span className="font-semibold text-ink-900 dark:text-ink-100">Amount</span>
                <span className="font-bold text-ink-900 dark:text-ink-100">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-ink-400">Payment status</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">PAID</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-ink-400">Transaction ID</span>
                <span className="font-mono text-ink-600 dark:text-ink-300">{payState.gatewayId}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-center">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Download Invoice
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Pay form (idle / initializing / failed) ─────────────────────────
  return (
    <div className="container-app py-10">
      <Link to="/cart" className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Back to cart
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="card p-5">
            <h2 className="mb-3 text-base font-bold text-ink-900 dark:text-ink-100">Delivery Address</h2>
            <Input label="Full address" id="address" placeholder="House no, street, city, PIN" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          <div className="card p-5">
            <h2 className="mb-3 text-base font-bold text-ink-900 dark:text-ink-100">Payment</h2>
            <p className="text-sm leading-relaxed text-ink-500">
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
              disabled={payState.phase === 'initializing'}
              onClick={() => void handlePay()}
            >
              <CreditCard className="h-5 w-5" /> {payState.phase === 'initializing' ? 'Preparing checkout…' : `Pay ${formatCurrency(total)}`}
            </Button>

            <p className="mt-4 flex items-center gap-1.5 text-xs text-ink-400">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> Payments are processed and verified securely by Razorpay (test mode).
            </p>
          </div>
        </div>

        <div className="card h-fit p-5">
          <h2 className="text-base font-bold text-ink-900 dark:text-ink-100">Order Summary</h2>
          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <div key={item.partId} className="flex justify-between text-sm">
                <span className="text-ink-600 dark:text-ink-300">{item.name} × {item.quantity}</span>
                <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm text-ink-600 dark:text-ink-300">
              <span>Delivery fee</span>
              <span className="font-medium">{formatCurrency(DELIVERY_FEE)}</span>
            </div>
            <div className="flex justify-between border-t border-ink-100 pt-3 font-bold text-ink-900 dark:border-ink-800 dark:text-ink-100">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <p className="text-[11px] leading-relaxed text-ink-400">
              The final total is recomputed server-side from the part prices + delivery fee when your order is placed.
            </p>
          </div>
          <Button className="mt-6 w-full" size="lg" loading={payState.phase === 'initializing'} disabled={payState.phase === 'initializing'} onClick={() => void handlePay()}>
            <CreditCard className="h-5 w-5" /> Place Order · {formatCurrency(total)}
          </Button>
        </div>
      </div>
    </div>
  );
}
