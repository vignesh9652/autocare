import { useMemo, useState } from 'react';
import { CalendarDays, Eye, MapPin, Timer, XCircle } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/Modal';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Timeline, { type TimelineStep } from '@/components/ui/Timeline';
import { useToast } from '@/components/ui/Toast';
import { useApiData } from '@/hooks/useApiData';
import { getBookings, updateBookingStatus } from '@/api/bookingApi';
import type { Booking } from '@/types';
import { getVehicles } from '@/api/vehicleApi';
import { getMechanics } from '@/api/mechanicApi';
import { getPayments } from '@/api/paymentApi';
import { paidBookingIdsFrom, toDashBooking, toDashMechanic, toDashVehicle } from '@/utils/apiMappers';
import type { Booking as DashBooking } from '@/types/dashboard';
import { formatCurrency, formatDate } from '@/utils/format';
import { bookingStatusVariant, paymentStatusVariant } from '@/utils/status';

interface BookingRow {
  api: Booking;
  dash: DashBooking;
}

function stepsFor(booking: DashBooking): TimelineStep[] {
  const status = booking.status;
  const done = (upto: DashBooking['status']) => {
    const order = ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'];
    return order.indexOf(status) >= order.indexOf(upto) && status !== 'CANCELLED';
  };
  return [
    { key: 'request', label: 'Request received', description: `Booking ${booking.id} created`, time: formatDate(booking.date), done: true },
    { key: 'assigned', label: 'Mechanic assigned', description: booking.mechanic, done: done('ACCEPTED'), current: status === 'ACCEPTED' },
    { key: 'inspection', label: 'Inspection & diagnosis', description: 'Vehicle checked and quote shared', done: done('IN_PROGRESS'), current: status === 'IN_PROGRESS' },
    { key: 'repair', label: 'Repair in progress', description: booking.service, done: done('COMPLETED'), current: status === 'COMPLETED' },
    { key: 'delivery', label: 'Ready for delivery', description: 'Collect or home delivery', done: status === 'COMPLETED' },
  ];
}

export default function MyBookings() {
  const bookings = useApiData(() => getBookings(), []);
  const vehicles = useApiData(() => getVehicles(), []);
  const mechanics = useApiData(() => getMechanics(), []);
  const payments = useApiData(() => getPayments(), []);
  const [viewing, setViewing] = useState<BookingRow | null>(null);
  const [tracking, setTracking] = useState<BookingRow | null>(null);
  const [cancelling, setCancelling] = useState<BookingRow | null>(null);
  const [busy, setBusy] = useState(false);
  const { success, error } = useToast();

  const rows = useMemo<BookingRow[]>(() => {
    const vehicleMap = new Map((vehicles.data ?? []).map((v) => [v.id, toDashVehicle(v)]));
    const mechanicMap = new Map((mechanics.data ?? []).map((m) => [toDashMechanic(m).id, toDashMechanic(m)]));
    const paid = paidBookingIdsFrom(payments.data ?? []);
    return (bookings.data ?? []).map((b) => ({
      api: b,
      dash: toDashBooking(b, vehicleMap, mechanicMap, paid),
    }));
  }, [bookings.data, vehicles.data, mechanics.data, payments.data]);

  const active = useMemo(
    () => rows.filter((r) => ['PENDING', 'ACCEPTED', 'IN_PROGRESS'].includes(r.dash.status)),
    [rows],
  );

  const loading = bookings.loading || vehicles.loading || mechanics.loading || payments.loading;

  const confirmCancel = async () => {
    if (!cancelling) return;
    setBusy(true);
    try {
      await updateBookingStatus(cancelling.api.id, 'CANCELLED');
      success('Booking cancelled', `${cancelling.dash.id} was cancelled and any payment will be refunded.`);
      setCancelling(null);
      bookings.refresh();
      payments.refresh();
    } catch (err) {
      error('Could not cancel booking', 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const columns: DataTableColumn<BookingRow>[] = [
    { key: 'id', header: 'Booking ID', render: (r) => <span className="font-bold text-brand-600 dark:text-brand-400">{r.dash.id}</span> },
    { key: 'vehicle', header: 'Vehicle', hideBelow: 'md', render: (r) => (
      <div>
        <p className="font-medium text-slate-800 dark:text-slate-100">{r.dash.vehicle.split('·')[0].trim()}</p>
        <p className="text-xs text-slate-400">{r.dash.vehicle.split('·')[1]?.trim()}</p>
      </div>
    ) },
    { key: 'mechanic', header: 'Mechanic', render: (r) => <span className="text-slate-600 dark:text-slate-300">{r.dash.mechanic}</span> },
    { key: 'date', header: 'Date', render: (r) => (
      <span className="text-slate-600 dark:text-slate-300">{formatDate(r.dash.date)}</span>
    ) },
    { key: 'time', header: 'Time', hideBelow: 'sm', render: (r) => <span className="text-slate-500 dark:text-slate-400">{r.dash.time}</span> },
    { key: 'status', header: 'Status', render: (r) => <Badge variant={bookingStatusVariant(r.dash.status)} dot>{r.dash.status.replace('_', ' ')}</Badge> },
    { key: 'payment', header: 'Payment', hideBelow: 'lg', render: (r) => <Badge variant={paymentStatusVariant(r.dash.paymentStatus)}>{r.dash.paymentStatus}</Badge> },
    { key: 'actions', header: 'Actions', render: (r) => (
      <div className="flex items-center gap-1.5">
        <button onClick={() => setViewing(r)} className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800 dark:hover:text-brand-400" title="View details">
          <Eye className="h-4 w-4" />
        </button>
        <button onClick={() => setTracking(r)} className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800 dark:hover:text-brand-400" title="Track booking">
          <Timer className="h-4 w-4" />
        </button>
        {r.dash.status !== 'CANCELLED' && r.dash.status !== 'COMPLETED' && (
          <button onClick={() => setCancelling(r)} className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400" title="Cancel booking">
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>
    ) },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="My Bookings"
        subtitle={`${active.length} active · track live status or cancel upcoming services`}
        icon={<CalendarDays className="h-5 w-5" />}
      />

      {loading ? (
        <div className="card h-64 animate-pulse" />
      ) : (
        <DataTable
          columns={columns}
          data={active}
          rowKey={(r) => r.dash.id}
          searchable
          searchPlaceholder="Search bookings…"
          searchFilter={(r, q) =>
            [r.dash.id, r.dash.vehicle, r.dash.mechanic, r.dash.service].some((v) => v.toLowerCase().includes(q))
          }
          emptyTitle="No active bookings"
          emptyDescription="Book a service to see it tracked here in real time."
        />
      )}

      {/* Details modal */}
      <Modal open={Boolean(viewing)} title={`Booking ${viewing?.dash.id ?? ''}`} onClose={() => setViewing(null)} maxWidth="max-w-lg">
        {viewing && (
          <div className="space-y-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={bookingStatusVariant(viewing.dash.status)} dot>{viewing.dash.status.replace('_', ' ')}</Badge>
              <Badge variant={paymentStatusVariant(viewing.dash.paymentStatus)}>{viewing.dash.paymentStatus}</Badge>
            </div>
            <dl className="grid grid-cols-2 gap-3">
              {[
                ['Service', viewing.dash.service],
                ['Vehicle', viewing.dash.vehicle],
                ['Mechanic', viewing.dash.mechanic],
                ['Date & time', `${formatDate(viewing.dash.date)} · ${viewing.dash.time}`],
                ['Amount', viewing.dash.amount ? formatCurrency(viewing.dash.amount) : 'Quote pending'],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                  <dt className="text-xs font-medium text-slate-400 dark:text-slate-500">{k}</dt>
                  <dd className="mt-0.5 font-semibold text-slate-800 dark:text-slate-100">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <MapPin className="h-3.5 w-3.5" /> {viewing.dash.location ?? 'Workshop location'}
            </p>
          </div>
        )}
      </Modal>

      {/* Track modal */}
      <Modal open={Boolean(tracking)} title={`Track · ${tracking?.dash.id ?? ''}`} onClose={() => setTracking(null)} maxWidth="max-w-md">
        {tracking && <Timeline steps={stepsFor(tracking.dash)} />}
      </Modal>

      <ConfirmDialog
        open={Boolean(cancelling)}
        title="Cancel this booking?"
        message={`${cancelling?.dash.id} · ${cancelling?.dash.service} on ${cancelling ? formatDate(cancelling.dash.date) : ''}. A full refund will be issued if already paid.`}
        confirmLabel={busy ? 'Cancelling…' : 'Cancel Booking'}
        danger
        onConfirm={confirmCancel}
        onCancel={() => setCancelling(null)}
      />
    </div>
  );
}
