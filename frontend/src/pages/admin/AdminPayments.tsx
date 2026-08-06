import { useMemo } from 'react';
import { CreditCard, IndianRupee, RotateCcw, Wallet } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import KpiCard from '@/components/ui/KpiCard';
import Badge from '@/components/ui/Badge';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import Skeleton from '@/components/ui/Skeleton';
import { useApiData } from '@/hooks/useApiData';
import { getAllPayments } from '@/api/paymentApi';
import { toDashPayment } from '@/utils/apiMappers';
import { formatCurrency, formatDate } from '@/utils/format';
import { paymentStatusVariant } from '@/utils/status';

export default function AdminPayments() {
  const payments = useApiData(() => getAllPayments(), []);

  const rows = useMemo(() => (payments.data ?? []).map(toDashPayment), [payments.data]);
  const all = payments.data ?? [];
  const total = all.filter((t) => t.status === 'SUCCESS').reduce((s, t) => s + t.amount, 0);
  const pending = all.filter((t) => t.status !== 'SUCCESS').length;
  const failed = all.filter((t) => t.status === 'FAILED').length;

  const columns: DataTableColumn<ReturnType<typeof toDashPayment>>[] = [
    { key: 'id', header: 'Transaction', render: (t) => <span className="font-bold text-brand-600 dark:text-brand-400">{t.id}</span> },
    { key: 'desc', header: 'Description', render: (t) => (
      <div>
        <p className="font-medium text-slate-800 dark:text-slate-100">{t.description}</p>
        <p className="text-xs text-slate-400">{t.bookingId}</p>
      </div>
    ) },
    { key: 'date', header: 'Date', hideBelow: 'md', render: (t) => <span className="text-slate-500 dark:text-slate-400">{formatDate(t.date)}</span> },
    { key: 'method', header: 'Method', hideBelow: 'lg', render: (t) => <Badge variant="neutral">{t.method}</Badge> },
    { key: 'amount', header: 'Amount', render: (t) => <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(t.amount)}</span> },
    { key: 'status', header: 'Status', render: (t) => <Badge variant={paymentStatusVariant(t.status)} dot>{t.status}</Badge> },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Payment Management"
        subtitle="All transactions across the platform"
        icon={<CreditCard className="h-5 w-5" />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Revenue" value={formatCurrency(total)} icon={<IndianRupee className="h-5 w-5" />} accent="emerald" loading={payments.loading} />
        <KpiCard label="Pending Payments" value={pending} icon={<Wallet className="h-5 w-5" />} accent="amber" loading={payments.loading} />
        <KpiCard label="Failed Payments" value={failed} icon={<RotateCcw className="h-5 w-5" />} accent="rose" loading={payments.loading} />
        <KpiCard label="Transactions" value={rows.length} icon={<CreditCard className="h-5 w-5" />} accent="violet" loading={payments.loading} />
      </div>

      <div className="mt-6">
        {payments.loading ? (
          <Skeleton className="h-96 w-full" />
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            rowKey={(t) => t.id}
            searchable
            searchPlaceholder="Search transactions…"
            searchFilter={(t, q) => [t.id, t.description, t.bookingId, t.method].some((v) => v.toLowerCase().includes(q))}
            emptyTitle="No transactions"
            emptyDescription="Payments will appear here as customers pay."
          />
        )}
      </div>
    </div>
  );
}
