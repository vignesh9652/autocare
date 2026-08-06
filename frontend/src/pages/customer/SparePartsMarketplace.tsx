import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, ShoppingCart, Star } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/Button';
import SearchInput from '@/components/ui/SearchInput';
import EmptyState from '@/components/ui/EmptyState';
import CartDrawer from '@/components/marketplace/CartDrawer';
import PartVisual, { PART_CATEGORY_STYLE } from '@/components/marketplace/PartVisual';
import { useCart } from '@/context/MarketplaceStore';
import { useToast } from '@/components/ui/Toast';
import { useApiData } from '@/hooks/useApiData';
import { getParts } from '@/api/sparePartsApi';
import { toMarketplacePart } from '@/utils/apiMappers';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { MarketplacePart } from '@/types';

type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'rating';

export default function SparePartsMarketplace() {
  const partsData = useApiData(() => getParts(), []);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState<SortKey>('featured');
  const [wishlist, setWishlist] = useState<Set<number>>(new Set());
  const [cartOpen, setCartOpen] = useState(false);
  const { count: cartCount } = useCart();
  const { add } = useCart();
  const { success, info } = useToast();
  const navigate = useNavigate();

  const allParts = useMemo<MarketplacePart[]>(
    () => (partsData.data ?? []).map(toMarketplacePart),
    [partsData.data],
  );

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(allParts.map((p) => p.category)))],
    [allParts],
  );

  const parts = useMemo(() => {
    let list = allParts.filter((p) => {
      const matchCat = category === 'All' || p.category === category;
      const matchQuery =
        p.name.toLowerCase().includes(query.trim().toLowerCase()) ||
        p.brand.toLowerCase().includes(query.trim().toLowerCase());
      return matchCat && matchQuery;
    });
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
    if (sort === 'rating') list = [...list].sort((a, b) => b.rating - a.rating);
    return list;
  }, [allParts, query, category, sort]);

  const addToCart = (part: MarketplacePart) => {
    if (part.stock <= 0) {
      info('Out of stock', `${part.name} will be restocked soon.`);
      return;
    }
    add(part);
    success('Added to cart', part.name);
  };

  const toggleWishlist = (id: number) =>
    setWishlist((w) => {
      const next = new Set(w);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const stockBadge = (p: MarketplacePart) =>
    p.stock <= 0 ? <Badge variant="danger">Out of stock</Badge>
      : p.stock < 10 ? <Badge variant="warning">Low stock · {p.stock} left</Badge>
      : <Badge variant="success">In stock</Badge>;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Spare Parts Marketplace"
        subtitle="Genuine parts · DIY guides · certified mechanic installation"
        icon={<ShoppingBag className="h-5 w-5" />}
        actions={
          <Button variant="secondary" onClick={() => setCartOpen(true)} className="relative">
            <ShoppingCart className="h-4 w-4" /> Cart
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-brand-600 to-sky-500 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Button>
        }
      />

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Search parts or brands…" className="w-full sm:w-72" />
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all',
                category === c
                  ? 'border-transparent bg-gradient-to-r from-brand-600 to-sky-500 text-white shadow-md shadow-brand-600/20'
                  : 'border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-brand-500/50 dark:hover:text-brand-400',
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="select ml-auto !w-auto !py-2 text-xs">
          <option value="featured">Featured</option>
          <option value="price-asc">Price: Low → High</option>
          <option value="price-desc">Price: High → Low</option>
          <option value="rating">Top rated</option>
        </select>
      </div>

      {partsData.loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="card h-72 animate-pulse" />
          ))}
        </div>
      ) : parts.length === 0 ? (
        <div className="card">
          <EmptyState
            title={partsData.error ? 'Could not load parts' : 'No parts match your search'}
            description={partsData.error ?? 'Try a different keyword or category.'}
            action={<Button variant="secondary" onClick={() => { setQuery(''); setCategory('All'); }}>Clear filters</Button>}
          />
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {parts.map((p) => {
            const wished = wishlist.has(p.id);
            const savings = p.mrp - p.price;
            return (
              <div key={p.id} className="card card-hover group relative flex flex-col overflow-hidden">
                {/* Visual */}
                <button
                  onClick={() => navigate(`/customer/parts/${p.id}`)}
                  className="relative block w-full"
                  aria-label={`View ${p.name}`}
                >
                  <PartVisual part={p} className="h-36 w-full" iconClassName="h-14 w-14 transition-transform duration-300 group-hover:scale-110" />
                  <span className="absolute left-3 top-3">{stockBadge(p)}</span>
                  {savings > 0 && (
                    <span className="absolute bottom-3 left-3 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                      {p.discountPercent}% OFF
                    </span>
                  )}
                </button>

                <button
                  onClick={() => toggleWishlist(p.id)}
                  aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
                  className={cn(
                    'absolute right-3 top-3 z-10 rounded-full p-2 transition-all',
                    wished
                      ? 'bg-rose-50 text-rose-500 dark:bg-rose-500/15 dark:text-rose-400'
                      : 'bg-white/80 text-slate-400 hover:text-rose-500 dark:bg-slate-900/70',
                  )}
                >
                  <Heart className={cn('h-4 w-4', wished && 'fill-current')} />
                </button>

                <div className="flex flex-1 flex-col p-4">
                  <button
                    onClick={() => navigate(`/customer/parts/${p.id}`)}
                    className="text-left"
                  >
                    <h3 className="truncate text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400">
                      {p.name}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {p.brand} · {PART_CATEGORY_STYLE[p.category]?.label ?? p.category}
                    </p>
                  </button>
                  <div className="mt-2 flex items-center gap-1 text-xs">
                    {p.rating > 0 ? (
                      <>
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-bold text-slate-700 dark:text-slate-200">{p.rating.toFixed(1)}</span>
                        <span className="text-slate-400">({p.reviewsCount})</span>
                      </>
                    ) : (
                      <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                        New arrival
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <p className="text-lg font-extrabold text-slate-900 dark:text-white">{formatCurrency(p.price)}</p>
                    {savings > 0 && <p className="text-xs text-slate-400 line-through">{formatCurrency(p.mrp)}</p>}
                  </div>
                  <div className="mt-auto flex gap-2 pt-3">
                    <Button variant="secondary" size="sm" className="flex-1" onClick={() => addToCart(p)} disabled={p.stock <= 0}>
                      <ShoppingCart className="h-3.5 w-3.5" /> Cart
                    </Button>
                    <Button size="sm" className="flex-1" onClick={() => navigate(`/customer/parts/${p.id}`)}>
                      <ShoppingBag className="h-3.5 w-3.5" /> View
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
