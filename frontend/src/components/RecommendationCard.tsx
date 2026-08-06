import StatusBadge from './StatusBadge';
import { formatCurrency } from '@/utils/format';
import type { Recommendation, RecommendationStatus } from '@/types';

interface RecommendationCardProps {
  recommendation: Recommendation;
  /** Called when the customer approves/rejects. Omit to hide the buttons. */
  onDecision?: (status: RecommendationStatus) => void;
  /** Disable the buttons while a decision is in flight. */
  busy?: boolean;
}

/** A mechanic's spare-part recommendation, with approve/reject while RECOMMENDED. */
export default function RecommendationCard({
  recommendation: rec,
  onDecision,
  busy = false,
}: RecommendationCardProps) {
  const { sparePart, quantity, reason, status } = rec;
  const total = sparePart.price * quantity;
  const undecided = status === 'RECOMMENDED';

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-900/50 p-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{sparePart.name}</h4>
          {undecided ? (
            <StatusBadge status="RECOMMENDED" label="Pending your approval" />
          ) : (
            <StatusBadge status={status} />
          )}
        </div>

        {reason && (
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-700 dark:text-slate-300">Mechanic's note:</span> {reason}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          <span>
            {quantity} × {formatCurrency(sparePart.price)}
          </span>
          <span className="rounded-full bg-slate-700/60 px-2 py-0.5 text-slate-700 dark:text-slate-300">
            {sparePart.category}
          </span>
          {sparePart.stockQuantity <= 0 && (
            <span className="text-red-700 dark:text-red-400">Out of stock</span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
        <div className="text-right">
          <div className="text-xs uppercase tracking-wide text-slate-500">Total</div>
          <div className="text-lg font-bold text-emerald-600 dark:text-accent-400">{formatCurrency(total)}</div>
        </div>

        {undecided && onDecision && (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => onDecision('APPROVED')}
              className="rounded-lg bg-emerald-600/90 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
            >
              Approve
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onDecision('REJECTED')}
              className="rounded-lg border border-red-500/40 px-3 py-1.5 text-xs font-semibold text-red-700 dark:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
