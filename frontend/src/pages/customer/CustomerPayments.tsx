import { useMemo, useState } from 'react';
import { CreditCard, Download, IndianRupee, Receipt, RotateCcw, Wallet } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import KpiCard from '@/components/ui/KpiCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { useToast } from '@/components/ui/Toast';
import { useApiData } from '@/hooks/useApiData';
import { getPayments, simulateWebhook } from '@/api/paymentApi';
import type { Payment as ApiPayment } from '@/types';
import { toDashPayment } from '@/utils/apiMappers';
import type { Payment as DashPayment } from '@/types/dashboard';
import { formatCurrency, formatDate } from '@/utils/format';
import { paymentStatusVariant } from '@/utils/status';

export default function CustomerPayments() {
  const payments = useApiData(() => getPayments(), []);
  const [paying, setPaying] = useState<ApiPayment | null>(null);
  const [method, setMethod] = useState<'UPI' | 'Card' | 'Net Banking'>('UPI');
  const [busy, setBusy] = useState(false);
  const { success, error } = useToast();

  const rows = useMemo<DashPayment[]>(() => (payments.data ?? []).map(toDashPayment), [payments.data]);
  const totalPaid = (payments.data ?? []).filter((p) => p.status === 'SUCCESS').reduce((s, p) => s + p.amount, 0);
  const pending = (payments.data ?? []).filter((p) => p.status !== 'SUCCESS');

  const payNow = async () => {
    if (!paying) return;
    setBusy(true);
    try {
      await simulateWebhook(paying.gatewayTransactionId, 'SUCCESS');
      success('Payment successful', `${formatCurrency(paying.amount)} paid via ${method}.`);
      setPaying(null);
      payments.refresh();
    } catch (err) {
      error('Payment failed', 'The gateway could not confirm the payment. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const columns: DataTableColumn<DashPayment>[] = [
    { key: 'id', header: 'Payment', render: (p) => <span className="font-bold text-brand-600 dark:text-brand-400">{p.id}</span> },
    { key: 'desc', header: 'Description', render: (p) => (
      <div>
        <p className="font-medium text-slate-800 dark:text-slate-100">{p.description}</p>
        <p className="text-xs text-slate-400">{p.bookingId}</p>
      </div>
    ) },
    { key: 'date', header: 'Date', hideBelow: 'md', render: (p) => <span className="text-slate-500 dark:text-slate-400">{formatDate(p.date)}</span> },
    { key: 'method', header: 'Method', hideBelow: 'lg', render: (p) => <Badge variant="neutral">{p.method}</Badge> },
    { key: 'amount', header: 'Amount', render: (p) => <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(p.amount)}</span> },
    { key: 'status', header: 'Status', render: (p) => <Badge variant={paymentStatusVariant(p.status)} dot>{p.status}</Badge> },
    { key: 'actions', header: 'Actions', render: (p) => (
      <div className="flex items-center gap-1.5">
        {p.status !== 'SUCCESS' ? (
          <Button size="sm" onClick={() => { setPaying(payments.data?.find((x) => x.id === Number(p.id.replace('TXN-', ''))) ?? null); setMethod('UPI'); }}>
            <Wallet className="h-3.5 w-3.5" /> Pay Now
          </Button>
        ) : (
          <button
            onClick={() => success('Invoice downloaded', `Invoice for ${p.id} saved as PDF.`)}
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800 dark:hover:text-brand-400"
            title="Download invoice"
          >
            <Download className="h-4 w-4" />
          </button>
        )}
      </div>
    ) },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Payments"
        subtitle="Track invoices, download receipts and pay pending dues"
        icon={<CreditCard className="h-5 w-5" />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <KpiCard label="Total Paid" value={formatCurrency(totalPaid)} icon={<IndianRupee className="h-5 w-5" />} accent="emerald" loading={payments.loading} />
        <KpiCard label="Pending Payments" value={pending.length} icon={<Wallet className="h-5 w-5" />} accent="amber" loading={payments.loading} />
        <KpiCard label="Transactions" value={rows.length} icon={<RotateCcw className="h-5 w-5" />} accent="violet" loading={payments.loading} />
      </div>

      {/* Online payment options */}
      <div className="card mb-6 flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
            <Receipt className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Online payment options</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">UPI, Cards, Net Banking — secure & instant</p>
          </div>
        </div>
        <div className="flex gap-2">
          {['UPI', 'Card', 'Net Banking'].map((m) => (
            <button key={m} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-brand-500/50 dark:hover:text-brand-400">
              {m}
            </button>
          ))}
        </div>
      </div>

      {payments.loading ? (
        <div className="card h-64 animate-pulse" />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          rowKey={(p) => p.id}
          searchable
          searchPlaceholder="Search payments…"
          searchFilter={(p, q) => [p.id, p.bookingId, p.description].some((v) => v.toLowerCase().includes(q))}
          emptyTitle="No payments yet"
          emptyDescription="Payments for your bookings will appear here."
        />
      )}

      <Modal open={Boolean(paying)} title={`Pay ${paying ? `TXN-${paying.id}` : ''}`} onClose={() => setPaying(null)}>
        {paying && (
          <div className="space-y-4">
            <div className="rounded-xl bg-gradient-to-r from-brand-600 to-sky-500 p-4 text-center text-white">
              <p className="text-xs uppercase tracking-wider text-white/70">Amount due</p>
              <p className="text-3xl font-extrabold">{formatCurrency(paying.amount)}</p>
              <p className="mt-0.5 text-xs text-white/80">
                {paying.referenceType === 'BOOKING' ? 'Booking' : 'Order'} #{paying.referenceId}
              </p>
            </div>
            <div>
              <label className="label">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {(['UPI', 'Card', 'Net Banking'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMethod(m)}
                    className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all ${
                      method === m
                        ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-500/20 dark:bg-brand-500/10 dark:text-brand-400'
                        : 'border-slate-200 text-slate-600 hover:border-brand-300 dark:border-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={payNow} disabled={busy}>
              <Wallet className="h-4 w-4" /> {busy ? 'Processing…' : `Pay ${formatCurrency(paying.amount)}`}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
