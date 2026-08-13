import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Package, ShoppingCart, Plus } from 'lucide-react';
import { partsApi } from '@/lib/api';
import { partImageUrl } from '@/lib/images';
import { CardSkeleton, EmptyState } from '@/components/ui/Feedback';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import { useCartStore } from '@/stores/cart-store';
import { toast } from '@/stores/toast-store';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const CATEGORIES = ['All', 'ENGINE', 'BRAKES', 'ELECTRICAL', 'FILTERS', 'SUSPENSION', 'EXHAUST', 'COOLING', 'BODY'];

export function PartsCatalogScreen() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const addItem = useCartStore((s) => s.addItem);
  const totalItems = useCartStore((s) => s.totalItems());

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['parts', category, search],
    queryFn: () => partsApi.getAll({ category: category || undefined, search: search || undefined }),
  });

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
      <section className="bg-gradient-to-b from-ink-950 to-ink-900 py-16">
        <div className="container-app">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">Spare Parts</h1>
              <p className="mt-2 text-ink-300">Genuine parts, doorstep delivery</p>
            </div>
            <Link
              to="/cart"
              className="relative rounded-2xl border border-ink-700 bg-ink-800/50 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-800"
            >
              <ShoppingCart className="mr-1.5 inline h-4 w-4" /> Cart
              {totalItems > 0 && (
                <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[10px] font-bold">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>

          <div className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-2xl border border-ink-700 bg-ink-800/50 px-4 py-1.5">
            <Search className="h-5 w-5 shrink-0 text-ink-400" />
            <input
              id="parts-search"
              className="w-full border-0 bg-transparent py-2 text-sm text-white placeholder:text-ink-500 outline-none"
              placeholder="Search parts…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat === 'All' ? '' : cat)}
                className={cn(
                  'rounded-xl px-3 py-1.5 text-xs font-medium transition',
                  (cat === 'All' && !category) || category === cat
                    ? 'bg-brand-500 text-white'
                    : 'bg-ink-800 text-ink-300 hover:bg-ink-700'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="container-app py-12">
        {isLoading ? (
          <CardSkeleton count={8} />
        ) : isError ? (
          <EmptyState title="Couldn't load parts" action={<button className="btn-secondary" onClick={() => void refetch()}>Retry</button>} />
        ) : !data || data.length === 0 ? (
          <EmptyState icon={<Package className="h-6 w-6" />} title="No parts found" description="Try a different search or category." />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.map((part, i) => (
              <motion.div
                key={part.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="card group overflow-hidden transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card-lg dark:hover:border-brand-500/40"
              >
                <Link to={`/parts/${part.id}`} className="block">
                  <div className="h-36 overflow-hidden">
                    <img
                      src={partImageUrl(part.category, part.imageUrl)}
                      alt={part.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                    />
                  </div>
                </Link>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/parts/${part.id}`}>
                      <h3 className="font-semibold text-ink-900 transition hover:text-brand-600 dark:text-ink-100">{part.name}</h3>
                    </Link>
                    <Badge variant="default">{part.category}</Badge>
                  </div>
                  {part.description && <p className="mt-1 line-clamp-2 text-xs text-ink-400">{part.description}</p>}
                  <div className="mt-3 flex items-center justify-between">
                    <p className="font-display text-lg font-bold text-brand-600 dark:text-brand-400">{formatCurrency(part.price)}</p>
                    {part.stockQuantity > 0 ? (
                      <button
                        onClick={() => {
                          addItem({ partId: part.id, name: part.name, price: part.price, category: part.category, imageUrl: partImageUrl(part.category, part.imageUrl), stock: part.stockQuantity });
                          toast('Added to cart', 'success');
                        }}
                        className="rounded-xl bg-brand-500 p-2 text-white transition hover:bg-brand-600 active:scale-95"
                        aria-label={`Add ${part.name} to cart`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    ) : (
                      <Badge variant="error">Out of stock</Badge>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
