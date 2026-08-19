import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Wallet, PiggyBank, ArrowDownCircle, ArrowUpCircle, CheckCircle2 } from 'lucide-react';
import { walletApi, getErrorMessage, invalidate } from '@/lib/api';
import { KpiCard } from '@/components/ui/KpiCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CardSkeleton, ErrorState, EmptyState } from '@/components/ui/Feedback';
import { StatusBadge } from '@/components/ui/Badge';
import { WalletTransactionResponse, WithdrawalRequestResponse } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';

/**
 * The mechanic's own earnings wallet. Credits arrive automatically when a
 * booking is paid; the mechanic can request a withdrawal, which an admin
 * approves before the money is ledgered out.
 */
export function MechanicWallet() {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const wallet = useQuery({ queryKey: ['mechanic-wallet'], queryFn: walletApi.mechanic });
  const transactions = useQuery({ queryKey: ['mechanic-wallet-transactions'], queryFn: walletApi.transactions });
  const withdrawals = useQuery({ queryKey: ['mechanic-withdrawals'], queryFn: walletApi.myWithdrawals });

  const requestWithdrawal = useMutation({
    mutationFn: (value: number) => walletApi.requestWithdrawal(value),
    onSuccess: () => {
      setError('');
      setSuccess('Withdrawal request submitted — an AutoCare admin will review it shortly.');
      setAmount('');
      invalidate(['mechanic-withdrawals']);
      invalidate(['mechanic-wallet']);
      invalidate(['mechanic-wallet-transactions']);
    },
    onError: (err) => {
      setSuccess('');
      setError(getErrorMessage(err));
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const value = Number(amount);
    if (!amount || Number.isNaN(value) || value <= 0) {
      setError('Enter an amount greater than zero');
      return;
    }
    requestWithdrawal.mutate(value);
  };

  if (wallet.isLoading) return <CardSkeleton count={3} />;
  if (wallet.isError || !wallet.data) {
    return <ErrorState message="Could not load your wallet" onRetry={() => wallet.refetch()} />;
  }

  const txns: WalletTransactionResponse[] = transactions.data ?? [];
  const history: WithdrawalRequestResponse[] = withdrawals.data ?? [];
  const earnings = txns.filter((t) => t.transactionType === 'CREDIT' || t.transactionType === 'REFUND');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink-900 dark:text-ink-100">My Wallet</h1>
        <p className="mt-1 text-sm text-ink-500">
          Your share of every paid booking, credited automatically after the customer pays.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Available Balance" value={formatCurrency(wallet.data.balance)} icon={<Wallet className="h-5 w-5" />} accent="brand" />
        <KpiCard label="Total Earnings" value={formatCurrency(wallet.data.totalEarnings)} icon={<PiggyBank className="h-5 w-5" />} accent="emerald" />
        <KpiCard label="Total Withdrawn" value={formatCurrency(wallet.data.totalWithdrawn)} icon={<ArrowUpCircle className="h-5 w-5" />} accent="sky" />
      </div>

      {success && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
          <CheckCircle2 className="h-5 w-5 shrink-0" /> {success}
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Withdraw money */}
      <div className="card p-5">
        <h2 className="mb-3 text-base font-bold text-ink-900 dark:text-ink-100">Withdraw Money</h2>
        <p className="mb-4 text-sm text-ink-500">
          Request a payout from your available balance. An AutoCare admin approves the request
          before the money is paid out.
        </p>
        <form onSubmit={submit} className="flex max-w-md items-end gap-3">
          <Input
            id="withdraw-amount"
            label="Amount (₹)"
            type="number"
            min={1}
            step="0.01"
            placeholder="e.g. 5000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Button type="submit" loading={requestWithdrawal.isPending}>
            Request Withdrawal
          </Button>
        </form>
      </div>

      {/* Withdrawal history */}
      <div className="card p-5">
        <h2 className="mb-4 text-base font-bold text-ink-900 dark:text-ink-100">Withdrawal Requests</h2>
        {history.length === 0 ? (
          <EmptyState
            icon={<ArrowUpCircle className="h-6 w-6" />}
            title="No withdrawal requests yet"
            description="Request a payout above and it will show up here."
          />
        ) : (
          <div className="divide-y divide-ink-100 dark:divide-ink-800">
            {history.map((w) => (
              <div key={w.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-semibold text-ink-900 dark:text-ink-100">{formatCurrency(w.amount)}</p>
                  <p className="text-xs text-ink-500">Requested {formatDateTime(w.requestedAt)}</p>
                </div>
                <StatusBadge kind="additional" status={w.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent earnings */}
      <div className="card p-5">
        <h2 className="mb-4 text-base font-bold text-ink-900 dark:text-ink-100">Recent Earnings</h2>
        {transactions.isLoading ? (
          <CardSkeleton count={3} />
        ) : earnings.length === 0 ? (
          <EmptyState
            icon={<ArrowDownCircle className="h-6 w-6" />}
            title="No earnings yet"
            description="Your earning from a paid booking will appear here automatically."
          />
        ) : (
          <div className="divide-y divide-ink-100 dark:divide-ink-800">
            {earnings.slice(0, 10).map((t) => (
              <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {t.transactionType === 'CREDIT' ? '+' : '−'}{formatCurrency(Math.abs(t.amount))}
                  </p>
                  <p className="text-xs text-ink-500">
                    {t.bookingId != null ? `Booking #${t.bookingId}` : '—'}
                    {t.paymentId != null ? ` · Payment #${t.paymentId}` : ''} · {t.description}
                  </p>
                </div>
                <span className="text-xs text-ink-400">{formatDateTime(t.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
