import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Wallet, HandCoins, PiggyBank, ArrowDownCircle, CheckCircle2, XCircle } from 'lucide-react';
import { adminApi, getErrorMessage, invalidate } from '@/lib/api';
import { KpiCard } from '@/components/ui/KpiCard';
import { Button } from '@/components/ui/Button';
import { CardSkeleton, ErrorState, EmptyState } from '@/components/ui/Feedback';
import { StatusBadge } from '@/components/ui/Badge';
import { WalletTransactionResponse, WithdrawalRequestResponse } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';

/**
 * AutoCare's single platform wallet: commission credited after every paid
 * booking, the full ledger, and mechanic withdrawal approvals.
 */
export function AdminWallet() {
  const [error, setError] = useState('');

  const wallet = useQuery({ queryKey: ['admin-wallet'], queryFn: adminApi.wallet });
  const transactions = useQuery({ queryKey: ['admin-wallet-transactions'], queryFn: adminApi.walletTransactions });
  const withdrawals = useQuery({
    queryKey: ['admin-withdrawals'],
    queryFn: () => adminApi.walletWithdrawals('PENDING'),
  });

  const settle = useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'approve' | 'reject' }) =>
      action === 'approve' ? adminApi.approveWithdrawal(id) : adminApi.rejectWithdrawal(id),
    onSuccess: () => {
      setError('');
      invalidate(['admin-withdrawals']);
      invalidate(['admin-wallet']);
      invalidate(['admin-wallet-transactions']);
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  if (wallet.isLoading) return <CardSkeleton count={3} />;
  if (wallet.isError || !wallet.data) {
    return <ErrorState message="Could not load the platform wallet" onRetry={() => wallet.refetch()} />;
  }

  const txns: WalletTransactionResponse[] = transactions.data ?? [];
  const pending: WithdrawalRequestResponse[] = withdrawals.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink-900 dark:text-ink-100">AutoCare Wallet</h1>
        <p className="mt-1 text-sm text-ink-500">
          Platform commission from every paid booking, held in a single platform wallet.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Balance" value={formatCurrency(wallet.data.balance)} icon={<Wallet className="h-5 w-5" />} accent="brand" />
        <KpiCard label="Total Commission" value={formatCurrency(wallet.data.totalCommission)} icon={<HandCoins className="h-5 w-5" />} accent="amber" />
        <KpiCard label="Total Withdrawn" value={formatCurrency(wallet.data.totalWithdrawn)} icon={<PiggyBank className="h-5 w-5" />} accent="sky" />
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Pending withdrawal requests */}
      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-ink-900 dark:text-ink-100">Pending Withdrawal Requests</h2>
          <span className="text-xs font-semibold text-ink-400">{pending.length} awaiting action</span>
        </div>
        {pending.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="h-6 w-6" />}
            title="No pending withdrawals"
            description="When a mechanic requests a withdrawal it will appear here for approval."
          />
        ) : (
          <div className="divide-y divide-ink-100 dark:divide-ink-800">
            {pending.map((w) => (
              <div key={w.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-semibold text-ink-900 dark:text-ink-100">{formatCurrency(w.amount)}</p>
                  <p className="text-xs text-ink-500">
                    Mechanic #{w.mechanicId} · requested {formatDateTime(w.requestedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge kind="additional" status={w.status} />
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={settle.isPending && settle.variables?.id === w.id && settle.variables?.action === 'approve'}
                    onClick={() => settle.mutate({ id: w.id, action: 'approve' })}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={settle.isPending && settle.variables?.id === w.id && settle.variables?.action === 'reject'}
                    onClick={() => settle.mutate({ id: w.id, action: 'reject' })}
                  >
                    <XCircle className="h-4 w-4" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ledger */}
      <div className="card p-5">
        <h2 className="mb-4 text-base font-bold text-ink-900 dark:text-ink-100">Wallet Transactions</h2>
        {transactions.isLoading ? (
          <CardSkeleton count={3} />
        ) : txns.length === 0 ? (
          <EmptyState icon={<ArrowDownCircle className="h-6 w-6" />} title="No transactions yet" description="Commission credits will appear once bookings are paid." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400 dark:border-ink-800">
                  <th className="py-2 pr-4 font-semibold">Amount</th>
                  <th className="py-2 pr-4 font-semibold">Type</th>
                  <th className="py-2 pr-4 font-semibold">Source</th>
                  <th className="py-2 pr-4 font-semibold">Description</th>
                  <th className="py-2 pr-4 font-semibold">Balance After</th>
                  <th className="py-2 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {txns.slice(0, 50).map((t) => (
                  <tr key={t.id}>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex items-center gap-1 font-semibold ${
                        t.transactionType === 'CREDIT' || t.transactionType === 'REFUND'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {t.transactionType === 'CREDIT' || t.transactionType === 'REFUND' ? '+' : '−'}{formatCurrency(Math.abs(t.amount))}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-medium text-ink-700 dark:text-ink-300">{t.transactionType}</td>
                    <td className="py-3 pr-4 text-ink-500">
                      {t.bookingId != null ? `Booking #${t.bookingId}` : '—'}
                      {t.paymentId != null ? ` · Pay #${t.paymentId}` : ''}
                    </td>
                    <td className="py-3 pr-4 text-ink-700 dark:text-ink-300">{t.description}</td>
                    <td className="py-3 pr-4 font-medium text-ink-900 dark:text-ink-100">{formatCurrency(t.balanceAfterTransaction)}</td>
                    <td className="py-3 text-ink-500">{formatDateTime(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
