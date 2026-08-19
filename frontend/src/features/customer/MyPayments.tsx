import { useQuery } from '@tanstack/react-query';
import { CreditCard } from 'lucide-react';
import { paymentApi } from '@/lib/api';
import { formatCurrency, formatDateTime, timeAgo } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/Badge';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/ui/Feedback';

export function MyPayments() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['my-payments'], queryFn: paymentApi.getMine });

  if (isLoading) return <CardSkeleton count={3} />;
  if (isError) return <ErrorState message="Could not load payments" onRetry={() => refetch()} />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink-900 dark:text-ink-100">Payments</h1>
        <p className="mt-1 text-sm text-ink-500">All your transactions in one place.</p>
      </div>

      {!data || data.length === 0 ? (
        <EmptyState icon={<CreditCard className="h-6 w-6" />} title="No payments yet" description="Payments appear here once you pay for a booking or order." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400 dark:border-ink-800">
                <th className="px-5 py-3 font-semibold">Reference</th>
                <th className="px-5 py-3 font-semibold">Method</th>
                <th className="px-5 py-3 font-semibold">Amount</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id} className="border-b border-ink-50 transition hover:bg-ink-50/60 last:border-0 dark:border-ink-800/60 dark:hover:bg-ink-800/40">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-ink-900 dark:text-ink-100">{p.referenceType.replace('_', ' ')}</p>
                    <p className="text-xs text-ink-400">#{p.referenceId} · {p.gatewayTransactionId.slice(0, 12)}…</p>
                  </td>
                  <td className="px-5 py-4 text-ink-600 dark:text-ink-300">{p.paymentMethod}</td>
                  <td className="px-5 py-4 font-bold text-ink-900 dark:text-ink-100">{formatCurrency(p.amount)}</td>
                  <td className="px-5 py-4"><StatusBadge kind="payment" status={p.status} /></td>
                  <td className="px-5 py-4 text-ink-500" title={formatDateTime(p.createdAt)}>{timeAgo(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
