import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPayments } from '@/api/paymentApi';
import { getApiErrorMessage } from '@/api/client';
import { Card, Spinner, StatusBadge } from '@/components';
import { formatCurrency, formatDateTime } from '@/utils/format';
import type { Payment } from '@/types';

export default function PaymentHistory() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setPayments(await getPayments());
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load payments'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="container-page py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Payment History</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your transactions, initiated and settled</p>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <Spinner label="Loading payments…" className="py-20" />
      ) : payments.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="text-4xl" aria-hidden>💳</p>
          <p className="mt-3 text-slate-500 dark:text-slate-400">No payments yet.</p>
          <p className="mt-1 text-sm text-slate-500">Payments appear here once you pay for a booking.</p>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 dark:bg-slate-900 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Transaction</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="hidden px-4 py-3 md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {payments.map((p) => (
                  <tr key={p.id} className="bg-slate-900/40 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800 dark:text-slate-200">#{p.id}</div>
                      <div className="text-xs text-slate-500">{p.gatewayTransactionId || 'Pending gateway…'}</div>
                    </td>
                    <td className="px-4 py-3">
                      {p.referenceType === 'BOOKING' ? (
                        <Link
                          to={`/bookings/${p.referenceId}`}
                          className="text-brand-600 dark:text-brand-400 hover:text-brand-600 dark:hover:text-brand-300"
                        >
                          Booking #{p.referenceId}
                        </Link>
                      ) : (
                        <span className="text-slate-700 dark:text-slate-300">Spare part #{p.referenceId}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-700/60 px-2.5 py-0.5 text-xs text-slate-700 dark:text-slate-300">
                        {p.paymentMethod ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(p.amount, p.currency)}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="hidden px-4 py-3 text-slate-500 dark:text-slate-400 md:table-cell">
                      {formatDateTime(p.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
