import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CalendarCheck, HandCoins, Hourglass, PiggyBank, Save, Wrench, XCircle } from 'lucide-react';
import { adminApi, getErrorMessage, serviceApi } from '@/lib/api';
import { toast } from '@/stores/toast-store';
import { AdminTable, StatusBadge } from './AdminTables';
import { KpiCard } from '@/components/ui/KpiCard';
import { Button } from '@/components/ui/Button';
import { CardSkeleton } from '@/components/ui/Feedback';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { BookingResponse, SPARE_PART_INSTALLATION } from '@/types';

export function AdminInstallations() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['admin-bookings'], queryFn: adminApi.allBookings });
  const { data: feeConfig, refetch: refetchFee } = useQuery({ queryKey: ['admin-installation-fee'], queryFn: serviceApi.getInstallationFee });
  const [feeDraft, setFeeDraft] = useState('');

  const all = (data ?? []) as BookingResponse[];
  const rows = useMemo(() => all.filter((b) => b.serviceType === SPARE_PART_INSTALLATION), [all]);

  const stats = useMemo(() => {
    const count = (s: string) => rows.filter((b) => b.status === s).length;
    const paid = rows.filter((b) => b.status === 'PAID');
    const revenue = paid.reduce((sum, b) => sum + (b.finalAmount ?? b.estimatedAmount ?? 0), 0);
    const commission = paid.reduce((sum, b) => sum + (b.platformCommission ?? 0), 0);
    const earnings = paid.reduce((sum, b) => sum + (b.mechanicEarning ?? 0), 0);
    return {
      total: rows.length,
      pending: count('PENDING'),
      accepted: count('ACCEPTED'),
      inProgress: count('IN_PROGRESS'),
      completed: count('COMPLETED'),
      cancelled: count('CANCELLED') + count('REJECTED'),
      revenue,
      commission,
      earnings,
    };
  }, [rows]);

  const updateFee = useMutation({
    mutationFn: (fee: number) => serviceApi.updateInstallationFee(fee),
    onSuccess: (_d, fee) => {
      toast(`Installation fee set to ${formatCurrency(fee)}`, 'success');
      void refetchFee();
      setFeeDraft('');
    },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  if (isLoading) return <CardSkeleton count={4} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink-900 dark:text-ink-100">Installation Management</h1>
        <p className="mt-1 text-sm text-ink-500">Spare-part installation requests (Book a Mechanic) across the platform.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Requests" value={stats.total} icon={<CalendarCheck className="h-5 w-5" />} accent="brand" />
        <KpiCard label="Pending" value={stats.pending} icon={<Hourglass className="h-5 w-5" />} accent="amber" />
        <KpiCard label="Accepted" value={stats.accepted} icon={<Wrench className="h-5 w-5" />} accent="sky" />
        <KpiCard label="In Progress" value={stats.inProgress} icon={<Hourglass className="h-5 w-5" />} accent="violet" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Completed" value={stats.completed} icon={<Wrench className="h-5 w-5" />} accent="emerald" />
        <KpiCard label="Cancelled" value={stats.cancelled} icon={<XCircle className="h-5 w-5" />} accent="rose" />
        <KpiCard label="Installation Revenue" value={`₹${stats.revenue.toLocaleString('en-IN')}`} icon={<CalendarCheck className="h-5 w-5" />} accent="emerald" />
        <KpiCard label="Platform Commission" value={`₹${stats.commission.toLocaleString('en-IN')}`} icon={<HandCoins className="h-5 w-5" />} accent="amber" />
        <KpiCard label="Mechanic Earnings" value={`₹${stats.earnings.toLocaleString('en-IN')}`} icon={<PiggyBank className="h-5 w-5" />} accent="sky" />
      </div>

      {/* Installation fee config */}
      <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-bold text-ink-900 dark:text-ink-100">
            <Wrench className="h-4 w-4 text-brand-500" /> Installation Fee
          </p>
          <p className="mt-0.5 text-xs text-ink-500">
            Flat fee AutoCare charges for every spare-part installation booking. Commission % is configured under Services &amp; Pricing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700">
            <span className="text-sm font-bold text-ink-400">₹</span>
            <input
              aria-label="Installation fee"
              type="number"
              min={0}
              step={1}
              defaultValue={feeConfig?.installationFee ?? 300}
              onChange={(e) => setFeeDraft(e.target.value)}
              className="w-24 bg-transparent text-sm font-bold text-ink-900 outline-none dark:text-ink-100"
            />
          </div>
          <Button
            size="sm"
            loading={updateFee.isPending}
            disabled={feeDraft === '' || Number(feeDraft) <= 0}
            onClick={() => updateFee.mutate(Number(feeDraft))}
          >
            <Save className="h-4 w-4" /> Update
          </Button>
        </div>
      </div>

      <AdminTable
        title="Spare Part Installation Requests"
        subtitle="Status is driven by the mechanic (accept → start → complete) and customer (pay)."
        rows={rows}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        searchPlaceholder="Search installation requests…"
        columns={[
          { header: '#', render: (r) => <span className="font-semibold text-ink-500">#{r.id}</span>, searchValue: (r) => String(r.id) },
          { header: 'Spare Part', render: (r) => <span className="font-semibold text-ink-900 dark:text-ink-100">Part #{r.sparePartId ?? '—'}</span>, searchValue: (r) => String(r.sparePartId ?? '') },
          { header: 'Order', render: (r) => <span className="text-ink-500">#{r.sparePartOrderId ?? '—'}</span>, searchValue: (r) => String(r.sparePartOrderId ?? '') },
          { header: 'Customer', render: (r) => <span className="text-ink-700 dark:text-ink-300">User #{r.userId}</span>, searchValue: (r) => String(r.userId) },
          { header: 'Mechanic', render: (r) => <span className="text-ink-700 dark:text-ink-300">{r.mechanicId ? `Mechanic #${r.mechanicId}` : '—'}</span>, searchValue: (r) => String(r.mechanicId ?? '') },
          { header: 'Fee', render: (r) => <span className="font-bold text-ink-900 dark:text-ink-100">{formatCurrency(r.finalAmount ?? r.estimatedAmount)}</span>, searchValue: (r) => String(r.estimatedAmount ?? '') },
          { header: 'Scheduled', render: (r) => <span className="text-ink-500">{formatDateTime(r.scheduledAt)}</span>, searchValue: (r) => r.scheduledAt },
          { header: 'Status', render: (r) => <StatusBadge kind="booking" status={r.status} />, searchValue: (r) => r.status },
          {
            header: 'Split (paid)',
            render: (r) =>
              r.status === 'PAID' ? (
                <span className="text-xs">
                  <span className="block text-amber-600 dark:text-amber-400">Commission −{formatCurrency(r.platformCommission)}</span>
                  <span className="block text-emerald-600 dark:text-emerald-400">Mechanic {formatCurrency(r.mechanicEarning)}</span>
                </span>
              ) : (
                <span className="text-ink-300 dark:text-ink-600">—</span>
              ),
            searchValue: (r) => `${r.platformCommission ?? ''} ${r.mechanicEarning ?? ''}`,
          },
        ]}
      />
    </div>
  );
}
