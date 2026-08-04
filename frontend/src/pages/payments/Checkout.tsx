import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createPayment, getPayment, simulateWebhook } from '@/api/paymentApi';
import { getBooking } from '@/api/bookingApi';
import { getApiErrorMessage } from '@/api/client';
import { Button, Card, Spinner } from '@/components';
import { formatCurrency, formatDateTime } from '@/utils/format';
import type { Booking, Payment } from '@/types';

const POLL_MS = 3_000;
const MAX_POLLS = 30; // give up after ~90s of polling

const PAYMENT_METHODS = ['UPI', 'CARD', 'NETBANKING'];

type Phase = 'idle' | 'processing' | 'success' | 'failed';

export default function Checkout() {
  const { bookingId: bookingIdParam } = useParams<{ bookingId: string }>();
  const bookingId = Number(bookingIdParam);
  const navigate = useNavigate();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [method, setMethod] = useState('UPI');
  const [phase, setPhase] = useState<Phase>('idle');
  const [payment, setPayment] = useState<Payment | null>(null);
  const [paying, setPaying] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const pollAttempts = useRef(0);

  const loadBooking = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setBooking(await getBooking(bookingId));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load booking'));
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    void loadBooking();
  }, [loadBooking]);

  /* Poll the payment every 3s while processing. */
  useEffect(() => {
    if (phase !== 'processing' || !payment) return;
    pollAttempts.current = 0;
    const interval = setInterval(async () => {
      pollAttempts.current += 1;
      try {
        const fresh = await getPayment(payment.id);
        if (fresh.status === 'SUCCESS') {
          setPayment(fresh);
          setPhase('success');
          setGaveUp(false);
        } else if (fresh.status === 'FAILED') {
          setPayment(fresh);
          setPhase('failed');
          setGaveUp(false);
        } else if (pollAttempts.current >= MAX_POLLS) {
          setGaveUp(true);
        }
      } catch {
        // transient poll failure — keep trying until MAX_POLLS
      }
    }, POLL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- payment id is stable per transaction
  }, [phase, payment?.id]);

  const handlePay = async () => {
    if (!booking?.estimatedCost) return;
    setPaying(true);
    setError('');
    try {
      const created = await createPayment({
        referenceType: 'BOOKING',
        referenceId: bookingId,
        amount: booking.estimatedCost,
        paymentMethod: method,
      });
      setPayment(created);
      setPhase('processing');
      setGaveUp(false);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to initiate payment'));
    } finally {
      setPaying(false);
    }
  };

  /** DEV-ONLY: pretend the payment gateway sent a SUCCESS webhook. */
  const handleSimulateWebhook = async () => {
    if (!payment?.gatewayTransactionId) return;
    setSimulating(true);
    setError('');
    try {
      await simulateWebhook(payment.gatewayTransactionId, 'SUCCESS');
      const fresh = await getPayment(payment.id);
      setPayment(fresh);
      setPhase(fresh.status === 'SUCCESS' ? 'success' : fresh.status === 'FAILED' ? 'failed' : 'processing');
      setGaveUp(false);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to simulate webhook'));
    } finally {
      setSimulating(false);
    }
  };

  /* ----------------------------- States ------------------------------ */
  if (loading) {
    return (
      <div className="container-page py-10">
        <Spinner label="Loading booking…" className="py-24" />
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="container-page py-16">
        <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      </div>
    );
  }

  if (!booking || booking.estimatedCost == null) {
    return (
      <div className="container-page py-16">
        <Card className="py-16 text-center">
          <p className="text-slate-400">This booking has no payable amount yet.</p>
          <Link to={`/bookings/${bookingId}`} className="mt-4 inline-block text-sm text-brand-400 hover:text-brand-300">
            ← Back to booking
          </Link>
        </Card>
      </div>
    );
  }

  if (phase === 'success') {
    return (
      <div className="container-page flex justify-center py-16">
        <Card className="w-full max-w-md p-8 text-center">
          <p className="text-5xl" aria-hidden>✅</p>
          <h1 className="mt-3 text-2xl font-bold text-slate-100">Payment Successful</h1>
          <p className="mt-2 text-sm text-slate-400">
            {formatCurrency(payment?.amount ?? booking.estimatedCost)} paid for booking{' '}
            <span className="font-semibold text-slate-200">#{booking.id}</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Transaction {payment?.gatewayTransactionId}
          </p>
          <div className="mt-6 flex gap-3">
            <Button className="flex-1" onClick={() => navigate(`/bookings/${booking.id}`)}>
              View Booking
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => navigate('/payments')}>
              Payment History
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (phase === 'failed') {
    return (
      <div className="container-page flex justify-center py-16">
        <Card className="w-full max-w-md p-8 text-center">
          <p className="text-5xl" aria-hidden>❌</p>
          <h1 className="mt-3 text-2xl font-bold text-slate-100">Payment Failed</h1>
          <p className="mt-2 text-sm text-slate-400">
            The payment for booking{' '}
            <span className="font-semibold text-slate-200">#{booking.id}</span> did not go through.
          </p>
          <div className="mt-6 space-y-2">
            <Button className="w-full" onClick={() => setPhase('idle')}>
              Retry Payment
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => navigate(`/bookings/${booking.id}`)}>
              Back to booking
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  /* ------------------------------ Idle / processing ------------------------------ */
  return (
    <div className="container-page flex justify-center py-10">
      <Card className="w-full max-w-md p-8">
        <Link to={`/bookings/${booking.id}`} className="text-sm text-brand-400 hover:text-brand-300">
          ← Back to booking
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-slate-100">Checkout</h1>
        <p className="mt-1 text-sm text-slate-400">
          Booking #{booking.id} · {booking.serviceType}
        </p>

        <div className="mt-5 rounded-xl border border-slate-700/60 bg-slate-900/50 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Amount due</span>
            <span className="text-xl font-extrabold text-accent-400">
              {formatCurrency(booking.estimatedCost)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Scheduled</span>
            <span>{formatDateTime(booking.scheduledAt)}</span>
          </div>
        </div>

        {phase === 'processing' ? (
          <div className="mt-6 text-center">
            <Spinner label="Processing payment…" className="py-4" />
            <p className="text-xs text-slate-500">
              Waiting for the gateway to confirm{payment?.gatewayTransactionId ? ` (${payment.gatewayTransactionId})` : ''}
            </p>
            {gaveUp && (
              <p className="mt-2 text-xs text-amber-400">
                Taking longer than expected. Check your payment history, or use the dev simulate
                button below.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-5">
            <label className="label" htmlFor="pay-method">Payment method</label>
            <select
              id="pay-method"
              className="input"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            {error && (
              <div role="alert" className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <Button onClick={handlePay} loading={paying} className="mt-5 w-full">
              {paying ? 'Processing…' : `Pay ${formatCurrency(booking.estimatedCost)}`}
            </Button>
          </div>
        )}

        {/* DEV-ONLY simulate webhook — visible while a payment exists */}
        {payment?.gatewayTransactionId && (
          <button
            type="button"
            onClick={handleSimulateWebhook}
            disabled={simulating}
            className="mt-6 w-full rounded-xl border-2 border-dashed border-amber-500/50 bg-amber-500/10 px-4 py-3 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-500/20 disabled:opacity-50"
          >
            {simulating ? 'Simulating…' : '🧪 Simulate Webhook Success (dev only)'}
          </button>
        )}
      </Card>
    </div>
  );
}
