import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ShoppingBag, ShoppingCart, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { partsApi } from '@/lib/api';
import { partImageUrl } from '@/lib/images';
import { useCartStore } from '@/stores/cart-store';
import { toast } from '@/stores/toast-store';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/ui/Feedback';

const CATEGORIES = ['All', 'Brakes', 'Engine', 'Filters', 'Electrical', 'Body', 'Suspension', 'Interior'];

export function MarketplaceScreen() {
  const { addItem, totalItems } = useCartStore();
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['all-parts'], queryFn: () => partsApi.getAll() });

  if (isLoading) return <CardSkeleton count={6} />;
  if (isError) return <ErrorState message="Could not load parts" onRetry={() => refetch()} />;

  const parts = (data ?? []).filter((p) => {
    const inCat = category === 'All' || p.category === category;
    const inSearch = !search || `${p.name} ${p.description ?? ''}`.toLowerCase().includes(search.toLowerCase());
    return inCat && inSearch;
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900 dark:text-ink-100">Marketplace</h1>
          <p className="mt-1 text-sm text-ink-500">Genuine spare parts, delivered to your door.</p>
        </div>
        <Link to="/cart" className="relative">
          <Button variant="outline">
            <ShoppingCart className="h-4 w-4" /> Cart
            {totalItems() > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                {totalItems()}
              </span>
            )}
          </Button>
        </Link>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input className="input pl-9" placeholder="Search parts…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                category === c ? 'bg-ink-900 text-white dark:bg-white dark:text-ink-900' : 'bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {parts.length === 0 ? (
        <EmptyState icon={<ShoppingBag className="h-6 w-6" />} title="No parts found" description="Try a different category or search term." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {parts.map((p) => (
            <motion.div key={p.id} whileHover={{ y: -4 }} className="card group overflow-hidden">
              <Link to={`/parts/${p.id}`} className="relative block h-40 overflow-hidden">
                <img
                  src={partImageUrl(p.category, p.imageUrl)}
                  alt={p.name}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ink-600 backdrop-blur dark:bg-ink-900/80 dark:text-ink-300">
                  {p.category}
                </span>
              </Link>
              <div className="p-4">
                <Link to={`/parts/${p.id}`} className="line-clamp-1 font-semibold text-ink-900 hover:text-brand-600 dark:text-ink-100 dark:hover:text-brand-400">
                  {p.name}
                </Link>
                <p className="mt-0.5 text-xs text-ink-400">{p.stockQuantity} in stock</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-lg font-extrabold text-ink-900 dark:text-ink-100">{formatCurrency(p.price)}</span>
                  <button
                    onClick={() => { addItem({ partId: p.id, name: p.name, price: p.price, category: p.category, imageUrl: partImageUrl(p.category, p.imageUrl), stock: p.stockQuantity }); toast(`${p.name} added to cart`, 'success'); }}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white transition hover:bg-brand-600 active:scale-95"
                    title="Add to cart"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
