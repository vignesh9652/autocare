import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/stores/cart-store';
import { partImageUrl } from '@/lib/images';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Feedback';
import { useAuthStore } from '@/stores/auth-store';

export function CartScreen() {
  const { items, setQuantity, removeItem, subtotal, clear } = useCartStore();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="container-app py-16">
        <EmptyState
          icon={<ShoppingBag className="h-6 w-6" />}
          title="Your cart is empty"
          description="Browse the catalog and add genuine spare parts."
          action={<Link to="/parts"><Button>Browse Parts</Button></Link>}
        />
      </div>
    );
  }

  return (
    <div className="container-app py-10">
      <Link to="/parts" className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Continue shopping
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.partId}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="card flex items-center gap-4 p-4"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-ink-50 dark:bg-ink-800">
                  <img src={partImageUrl(item.category, item.imageUrl)} alt={item.name} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink-900 dark:text-ink-100">{item.name}</p>
                  <p className="text-xs text-ink-400">{item.category} · {formatCurrency(item.price)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setQuantity(item.partId, item.quantity - 1)} className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800">
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                  <button onClick={() => setQuantity(item.partId, item.quantity + 1)} className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <p className="w-20 text-right font-semibold text-ink-900 dark:text-ink-100">{formatCurrency(item.price * item.quantity)}</p>
                <button onClick={() => removeItem(item.partId)} className="rounded-lg p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10">
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          <button onClick={clear} className="text-xs font-medium text-red-600 hover:underline">
            Clear cart
          </button>
        </div>

        <div className="card h-fit p-5">
          <h2 className="text-base font-bold text-ink-900 dark:text-ink-100">Order Summary</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-ink-600 dark:text-ink-300">
              <span>Items ({items.reduce((s, i) => s + i.quantity, 0)})</span>
              <span>{formatCurrency(subtotal())}</span>
            </div>
            <div className="flex justify-between text-ink-600 dark:text-ink-300">
              <span>Delivery</span>
              <span className="text-emerald-600">Free</span>
            </div>
            <div className="flex justify-between border-t border-ink-100 pt-3 font-bold text-ink-900 dark:border-ink-800 dark:text-ink-100">
              <span>Total</span>
              <span>{formatCurrency(subtotal())}</span>
            </div>
          </div>
          <Button className="mt-6 w-full" size="lg" onClick={() => (user ? navigate('/checkout') : navigate('/login'))}>
            {user ? <>Proceed to Checkout <ArrowRight className="h-5 w-5" /></> : 'Sign in to Checkout'}
          </Button>
        </div>
      </div>
    </div>
  );
}
