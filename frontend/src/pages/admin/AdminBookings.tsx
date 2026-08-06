import { useMemo, useState } from 'react';
import { CalendarDays, Eye, XCircle } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/Modal';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Skeleton from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { useApiData } from '@/hooks/useApiData';
import { getAllBookings, updateBookingStatus } from '@/api/bookingApi';
import type { Booking } from '@/types';
import { getAdminMechanics } from '@/api/adminApi';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { bookingStatusVariant } from '@/utils/status';

const STATUS_OPTIONS: Booking['status'][] = ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED'];

export default function AdminBookings() {
  const bookings = useApiData(() => getAllBookings(), []);
  const mechanics = useApiData(() => getAdminMechanics(), []);
  const [viewing, setViewing] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState<Booking | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const { success, error } = useToast();

  const mechanicNames = useMemo(() => {
    const map = new Map<number, string>();
    for (const m of mechanics.data ?? []) {
      if (typeof m.id === 'number' && typeof m.name === 'string') map.set(m.id, m.name);
    }
    return map;
  }, [mechanics.data]);

  const rows = useMemo(() => bookings.data ?? [], [bookings.data]);

  const setStatus = async (b: Booking, status: Booking['status']) => {
    if (status === b.status) return;
    setBusyId(b.id);
    try {
      await updateBookingStatus(b.id, status);
      success('Status updated', `#${b.id} → ${status.replace('_', ' ')}.`);
      bookings.refresh();
    } catch (err) {
      error('Update failed', `Could not move #${b.id} to ${status.replace('_', ' ')}.`);
    } finally {
      setBusyId(null);
    }
  };

  const columns: DataTableColumn<Booking>[] = [
    { key: 'id', header: 'Booking ID', render: (b) => <span className="font-bold text-brand-600 dark:text-brand-400">#{b.id}</span> },
    { key: 'customer', header: 'Customer', hideBelow: 'md', render: (b) => <span className="text-slate-600 dark:text-slate-300">User #{b.userId}</span> },
    { key: 'vehicle', header: 'Vehicle', render: (b) => <span className="text-slate-600 dark:text-slate-300">#{b.vehicleId}</span> },
    { key: 'mechanic', header: 'Mechanic', render: (b) => (
      <span className="text-slate-600 dark:text-slate-300">
        {b.mechanicId !== null ? (mechanicNames.get(b.mechanicId) ?? `#${b.mechanicId}`) : 'Unassigned'}
      </span>
    ) },
    { key: 'service', header: 'Service Type', hideBelow: 'lg', render: (b) => <span className="text-slate-600 dark:text-slate-300">{b.serviceType}</span> },
    { key: 'scheduledAt', header: 'Scheduled', hideBelow: 'lg', render: (b) => (
      <span className="whitespace-nowrap text-slate-500 dark:text-slate-400">{formatDateTime(b.scheduledAt)}</span>
    ) },
    { key: 'amount', header: 'Cost', render: (b) => (
      <span className="font-bold text-slate-800 dark:text-slate-100">{b.estimatedCost ? formatCurrency(b.estimatedCost) : '—'}</span>
    ) },
    { key: 'status', header: 'Status', render: (b) => (
      <select
        value={b.status}
        disabled={busyId === b.id}
        onChange={(e) => setStatus(b, e.target.value as Booking['status'])}
        className="select !w-auto !py-1 text-xs"
        aria-label={`Status for #${b.id}`}
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>{s.replace('_', ' ')}</option>
        ))}
      </select>
    ) },
    { key: 'actions', header: 'Actions', render: (b) => (
      <div className="flex items-center gap-1">
        <button onClick={() => setViewing(b)} className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800 dark:hover:text-brand-400" title="View details">
          <Eye className="h-4 w-4" />
        </button>
        {b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && (
          <button onClick={() => setCancelling(b)} className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400" title="Cancel booking">
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>
    ) },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Booking Management"
        subtitle={`${rows.length} bookings · control statuses across the platform`}
        icon={<CalendarDays className="h-5 w-5" />}
      />

      {bookings.loading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          rowKey={(b) => b.id}
          searchable
          searchPlaceholder="Search bookings…"
          searchFilter={(b, q) => [String(b.id), b.serviceType, b.status].some((v) => v.toLowerCase().includes(q))}
          emptyTitle="No bookings found"
          emptyDescription="Bookings from all customers will appear here."
        />
      )}

      <Modal open={Boolean(viewing)} title={`Booking #${viewing?.id ?? ''}`} onClose={() => setViewing(null)} maxWidth="max-w-lg">
        {viewing && (
          <div className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge variant={bookingStatusVariant(viewing.status)} dot>{viewing.status.replace('_', ' ')}</Badge>
            </div>
            <dl className="grid grid-cols-2 gap-3">
              {[
                ['Customer', `User #${viewing.userId}`],
                ['Vehicle', `#${viewing.vehicleId}`],
                ['Mechanic', viewing.mechanicId !== null ? (mechanicNames.get(viewing.mechanicId) ?? `#${viewing.mechanicId}`) : 'Unassigned'],
                ['Service', viewing.serviceType],
                ['Scheduled', formatDateTime(viewing.scheduledAt)],
                ['Amount', viewing.estimatedCost ? formatCurrency(viewing.estimatedCost) : '—'],
                ['Address', viewing.address],
                ['Created', formatDateTime(viewing.createdAt)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                  <dt className="text-xs font-medium text-slate-400 dark:text-slate-500">{k}</dt>
                  <dd className="mt-0.5 font-semibold text-slate-800 dark:text-slate-100">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(cancelling)}
        title="Cancel this booking?"
        message={`#${cancelling?.id} · ${cancelling?.serviceType}. The customer will be notified and any payment refunded.`}
        confirmLabel="Cancel Booking"
        danger
        onConfirm={async () => {
          if (!cancelling) return;
          try {
            await updateBookingStatus(cancelling.id, 'CANCELLED');
            success('Booking cancelled', `#${cancelling.id} was cancelled.`);
            bookings.refresh();
          } catch (err) {
            error('Could not cancel', 'Please try again.');
          }
          setCancelling(null);
        }}
        onCancel={() => setCancelling(null)}
      />
    </div>
  );
}
