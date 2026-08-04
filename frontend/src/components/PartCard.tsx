import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { formatCurrency } from '@/utils/format';
import type { SparePart } from '@/types';

interface PartCardProps {
  part: SparePart;
}

const LOW_STOCK_THRESHOLD = 5;

/** Spare part card used in the catalog grid — links through to the detail page. */
export default function PartCard({ part }: PartCardProps) {
  const lowStock = part.stockQuantity <= LOW_STOCK_THRESHOLD;

  return (
    <Link
      to={`/spare-parts/${part.id}`}
      className="card card-hover flex flex-col p-5 transition-transform duration-150 hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-100">{part.name}</h3>
        <StatusBadge status={lowStock ? 'LOW STOCK' : 'IN STOCK'} />
      </div>

      {part.description && (
        <p className="mt-2 line-clamp-2 text-sm text-slate-400">{part.description}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-brand-600/15 px-2.5 py-0.5 text-xs font-medium text-brand-300">
          {part.category}
        </span>
        {part.compatibleVehicleModels.slice(0, 2).map((m) => (
          <span key={m} className="rounded-full bg-slate-700/60 px-2.5 py-0.5 text-xs text-slate-300">
            {m}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-slate-700/50 pt-3">
        <span className="text-lg font-bold text-accent-400">{formatCurrency(part.price)}</span>
        <span className={`text-xs font-medium ${lowStock ? 'text-red-400' : 'text-slate-400'}`}>
          {part.stockQuantity === 0
            ? 'Out of stock'
            : `${part.stockQuantity} in stock`}
        </span>
      </div>
    </Link>
  );
}
