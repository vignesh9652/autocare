import { ArrowRight, Minus, Plus, ShoppingBag, ShoppingCart, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/Button';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { useCart } from '@/context/MarketplaceStore';
import { formatCurrency } from '@/utils/format';
import PartVisual from './PartVisual';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

/** Slide-in cart drawer used across the marketplace pages. */
export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { lines, count, subtotal, updateQty, remove } = useCart();
  const { info } = useToast();
  const navigate = useNavigate();

  if (!open) return null;

  const goToCheckout = () => {
    if (lines.length === 0) return;
    onClose();
    navigate('/customer/checkout');
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 animate-fade-in bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-slide-up absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            <ShoppingCart className="h-4 w-4 text-brand-600 dark:text-brand-400" /> Your Cart ({count})
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {lines.length === 0 ? (
            <EmptyState
              icon={<ShoppingBag className="h-9 w-9" />}
              title="Your cart is empty"
              description="Add genuine spare parts from the marketplace and choose DIY or professional installation."
            />
          ) : (
            <div className="space-y-3">
              {lines.map((line) => (
                <div
                  key={line.part.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800"
                >
                  <PartVisual
                    part={line.part}
                    className="h-14 w-14 shrink-0 rounded-lg"
                    iconClassName="h-7 w-7"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {line.part.name}
                    </p>
                    <p className="text-xs text-slate-400">{formatCurrency(line.part.price)} each</p>
                    {line.part.stock < 10 && (
                      <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                        Only {line.part.stock} left
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQty(line.part.id, line.qty - 1)}
                      className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-slate-800 dark:text-slate-100">
                      {line.qty}
                    </span>
                    <button
                      onClick={() => updateQty(line.part.id, line.qty + 1)}
                      className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => remove(line.part.id)}
                    className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                    aria-label="Remove from cart"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 p-5 dark:border-slate-800">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
            <span className="text-lg font-extrabold text-slate-900 dark:text-white">
              {formatCurrency(subtotal)}
            </span>
          </div>
          <Button className="w-full" disabled={lines.length === 0} onClick={goToCheckout}>
            Proceed to Checkout <ArrowRight className="h-4 w-4" />
          </Button>
          <button
            onClick={() => {
              info('Keep shopping', 'Browse more genuine parts from the marketplace.');
              onClose();
            }}
            className="mt-3 w-full text-center text-xs font-semibold text-slate-500 transition-colors hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
          >
            Continue shopping
          </button>
        </div>
      </div>
    </div>
  );
}
