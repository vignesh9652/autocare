import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, ShieldCheck } from 'lucide-react';
import { useCartStore } from '@/stores/cart-store';
import { paymentApi, getErrorMessage } from '@/lib/api';
import { toast } from '@/stores/toast-store';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/Feedback';

const METHODS = ['UPI', 'CARD', 'NETBANKING', 'WALLET'];

export function CheckoutScreen() {
  const { items, subtotal, clear } = useCartStore();
  const navigate = useNavigate();
  const [method, setMethod] = useState('UPI');
  const [address, setAddress] = useState('');
  const [paying, setPaying] = useState(false);

  if (items.length === 0) {
    return (
      <div className="container-app py-16">
        <EmptyState title="Nothing to check out" description="Your cart is empty." action={<Link to="/parts"><Button>Browse Parts</Button></Link>} />
      </div>
    );
  }

  const handlePay = async () => {
    setPaying(true);
    try {
      const results = await Promise.all(
        items.map((item) =>
          paymentApi.create({
            referenceType: 'SPARE_PART',
            referenceId: item.partId,
            amount: item.price * item.quantity,
            paymentMethod: method,
          })
        )
      );
      clear();
      const txn = results[0];
      toast(`Payment initiated! Gateway ID: ${txn.gatewayTransactionId.slice(0, 12)}…`, 'success');
      navigate('/dashboard/payments');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setPaying(false);
    }
  };

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
            <h2 className="mb-3 text-base font-bold text-ink-900 dark:text-ink-100">Payment Method</h2>
            <div className="grid grid-cols-2 gap-3">
              {METHODS.map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`rounded-xl border-2 p-4 text-sm font-semibold transition ${
                    method === m ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400' : 'border-ink-100 text-ink-600 hover:border-ink-200 dark:border-ink-700 dark:text-ink-300'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-400">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> Payments are gateway-secured. In this demo, payments initiate and complete via webhook.
            </p>
          </div>
        </div>

        <div className="card h-fit p-5">
          <h2 className="text-base font-bold text-ink-900 dark:text-ink-100">Summary</h2>
          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <div key={item.partId} className="flex justify-between text-sm">
                <span className="text-ink-600 dark:text-ink-300">{item.name} × {item.quantity}</span>
                <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-ink-100 pt-3 font-bold text-ink-900 dark:border-ink-800 dark:text-ink-100">
              <span>Total</span>
              <span>{formatCurrency(subtotal())}</span>
            </div>
          </div>
          <Button className="mt-6 w-full" size="lg" loading={paying} onClick={handlePay}>
            <CreditCard className="h-5 w-5" /> Pay {formatCurrency(subtotal())}
          </Button>
        </div>
      </div>
    </div>
  );
}
