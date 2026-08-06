import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Package, ShoppingBag, Truck } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/Button';
import PartVisual from '@/components/marketplace/PartVisual';
import { useOrders } from '@/context/MarketplaceStore';
import { useApiData } from '@/hooks/useApiData';
import { getParts } from '@/api/sparePartsApi';
import { toMarketplacePart } from '@/utils/apiMappers';
import { formatCurrency, formatDate } from '@/utils/format';
import { cn } from '@/utils/cn';

export default function MyOrders() {
  const { orders } = useOrders();
  const navigate = useNavigate();
  const catalog = useApiData(() => getParts(), []);
  const [filter, setFilter] = useState<'all' | 'DIY' | 'MECHANIC'>('all');

  const partById = useMemo(() => {
    const map = new Map<number, ReturnType<typeof toMarketplacePart>>();
    for (const p of catalog.data ?? []) map.set(p.id, toMarketplacePart(p));
    return map;
  }, [catalog.data]);

  const filtered = useMemo(
    () => orders.filter((o) => filter === 'all' || o.mode === filter),
    [orders, filter],
  );

  const activeCount = orders.filter(
    (o) => !['Completed', 'Order Complete'].includes(o.status),
  ).length;

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            My Orders
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Track your spare part orders and installations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="info" dot>{activeCount} active</Badge>
          <Badge variant="neutral">{orders.length} total</Badge>
        </div>
      </div>

      {/* Mode filter */}
      <div className="mb-5 flex gap-1.5">
        {(
          [
            { key: 'all', label: 'All orders' },
            { key: 'DIY', label: 'DIY' },
            { key: 'MECHANIC', label: 'With mechanic' },
          ] as const
        ).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all',
              filter === f.key
                ? 'border-transparent bg-gradient-to-r from-brand-600 to-sky-500 text-white shadow-md shadow-brand-600/20'
                : 'border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-brand-500/50 dark:hover:text-brand-400',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Package className="h-9 w-9" />}
            title="No orders here yet"
            description="Buy a spare part from the marketplace — with or without a mechanic — and it will show up here."
            action={
              <Button onClick={() => navigate('/customer/parts')}>
                <ShoppingBag className="h-4 w-4" /> Browse parts
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => (
            <button
              key={order.id}
              onClick={() => navigate(`/customer/orders/${order.id}`)}
              className="card card-hover block w-full p-5 text-left"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white">{order.id}</p>
                  <Badge variant={order.mode === 'MECHANIC' ? 'brand' : 'neutral'}>
                    {order.mode === 'MECHANIC' ? 'Professional install' : 'DIY'}
                  </Badge>
                  <Badge variant="success" dot>{order.status}</Badge>
                </div>
                <p className="text-xs text-slate-400">{formatDate(order.placedAt)}</p>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4">
                {order.lines.map((line) => {
                  const part = partById.get(line.partId);
                  return (
                    <div key={line.partId} className="flex min-w-0 items-center gap-3">
                      {part ? (
                        <PartVisual part={part} className="h-14 w-14 shrink-0 rounded-xl" iconClassName="h-7 w-7" />
                      ) : (
                        <span className="h-14 w-14 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                          {line.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          Qty {line.quantity} · {line.brand}
                        </p>
                        {order.mechanic && (
                          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-brand-600 dark:text-brand-400">
                            <Truck className="h-3 w-3" /> {order.mechanic.name} · {order.mechanic.date} {order.mechanic.time}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div className="ml-auto flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Total</p>
                    <p className="text-base font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(order.total)}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Est. delivery {formatDate(order.estimatedDelivery)}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
