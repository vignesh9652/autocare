import { useMemo, useState } from 'react';
import { Download, Eye, History } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/Modal';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import Tabs from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import { useApiData } from '@/hooks/useApiData';
import { getBookings } from '@/api/bookingApi';
import { getVehicles } from '@/api/vehicleApi';
import { getMechanics } from '@/api/mechanicApi';
import { getPayments } from '@/api/paymentApi';
import { paidBookingIdsFrom, toDashBooking, toDashMechanic, toDashVehicle } from '@/utils/apiMappers';
import type { Booking as DashBooking } from '@/types/dashboard';
import { formatCurrency, formatDate } from '@/utils/format';
import { bookingStatusVariant } from '@/utils/status';

type Filter = 'ALL' | 'COMPLETED' | 'CANCELLED';

export default function BookingHistory() {
  const bookings = useApiData(() => getBookings(), []);
  const vehicles = useApiData(() => getVehicles(), []);
  const mechanics = useApiData(() => getMechanics(), []);
  const payments = useApiData(() => getPayments(), []);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [viewing, setViewing] = useState<DashBooking | null>(null);
  const { success } = useToast();

  const rows = useMemo<DashBooking[]>(() => {
    const vehicleMap = new Map((vehicles.data ?? []).map((v) => [v.id, toDashVehicle(v)]));
    const mechanicMap = new Map((mechanics.data ?? []).map((m) => [toDashMechanic(m).id, toDashMechanic(m)]));
    const paid = paidBookingIdsFrom(payments.data ?? []);
    return (bookings.data ?? [])
      .map((b) => toDashBooking(b, vehicleMap, mechanicMap, paid))
      .filter((b) => (filter === 'ALL' ? true : b.status === filter));
  }, [bookings.data, vehicles.data, mechanics.data, payments.data, filter]);

  const loading = bookings.loading || vehicles.loading || mechanics.loading || payments.loading;

  const count = (status: Filter) => {
    const all = bookings.data ?? [];
    if (status === 'ALL') return all.length;
    return all.filter((b) => b.status === status).length;
  };

  const columns: DataTableColumn<DashBooking>[] = [
    { key: 'id', header: 'Booking ID', render: (b) => <span className="font-bold text-slate-700 dark:text-slate-200">{b.id}</span> },
    { key: 'vehicle', header: 'Vehicle', hideBelow: 'md', render: (b) => (
      <div>
        <p className="font-medium text-slate-800 dark:text-slate-100">{b.vehicle.split('·')[0].trim()}</p>
        <p className="text-xs text-slate-400">{b.vehicle.split('·')[1]?.trim()}</p>
      </div>
    ) },
    { key: 'service', header: 'Service', render: (b) => <span className="text-slate-600 dark:text-slate-300">{b.service}</span> },
    { key: 'mechanic', header: 'Mechanic', hideBelow: 'md', render: (b) => <span className="text-slate-600 dark:text-slate-300">{b.mechanic}</span> },
    { key: 'date', header: 'Scheduled', render: (b) => <span className="text-slate-500 dark:text-slate-400">{formatDate(b.date)}</span> },
    { key: 'status', header: 'Status', render: (b) => <Badge variant={bookingStatusVariant(b.status)}>{b.status.replace('_', ' ')}</Badge> },
    { key: 'amount', header: 'Amount', render: (b) => <span className="font-bold text-slate-800 dark:text-slate-100">{b.amount ? formatCurrency(b.amount) : '—'}</span> },
    { key: 'actions', header: 'Actions', render: (b) => (
      <div className="flex items-center gap-1.5">
        <button onClick={() => setViewing(b)} className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800 dark:hover:text-brand-400" title="View details">
          <Eye className="h-4 w-4" />
        </button>
        <button
          onClick={() => success('Invoice downloaded', `Invoice for ${b.id} saved as PDF.`)}
          className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800 dark:hover:text-brand-400"
          title="Download invoice"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>
    ) },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Booking History"
        subtitle="Past services and invoices — download receipts anytime"
        icon={<History className="h-5 w-5" />}
      />

      <div className="mb-4">
        <Tabs
          items={[
            { key: 'ALL', label: 'All', count: count('ALL') },
            { key: 'COMPLETED', label: 'Completed', count: count('COMPLETED') },
            { key: 'CANCELLED', label: 'Cancelled', count: count('CANCELLED') },
          ]}
          active={filter}
          onChange={(k) => setFilter(k as Filter)}
          variant="pill"
        />
      </div>

      {loading ? (
        <div className="card h-64 animate-pulse" />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          rowKey={(b) => b.id}
          searchable
          searchPlaceholder="Search history…"
          searchFilter={(b, q) => [b.id, b.vehicle, b.mechanic, b.service].some((v) => v.toLowerCase().includes(q))}
          emptyTitle="No bookings here"
          emptyDescription="Completed and cancelled bookings will show up in this history."
        />
      )}

      <Modal open={Boolean(viewing)} title={`Invoice · ${viewing?.id ?? ''}`} onClose={() => setViewing(null)} maxWidth="max-w-md">
        {viewing && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-brand-600 to-sky-500 p-4 text-white">
              <div>
                <p className="text-xs uppercase tracking-wider text-white/70">Amount paid</p>
                <p className="text-2xl font-extrabold">{viewing.amount ? formatCurrency(viewing.amount) : '—'}</p>
              </div>
              <Badge variant="neutral" className="!bg-white/15 !text-white !border-white/25">{viewing.paymentStatus}</Badge>
            </div>
            <dl className="grid grid-cols-2 gap-3">
              {[
                ['Service', viewing.service],
                ['Vehicle', viewing.vehicle],
                ['Mechanic', viewing.mechanic],
                ['Date', formatDate(viewing.date)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                  <dt className="text-xs font-medium text-slate-400 dark:text-slate-500">{k}</dt>
                  <dd className="mt-0.5 font-semibold text-slate-800 dark:text-slate-100">{v}</dd>
                </div>
              ))}
            </dl>
            <button
              onClick={() => success('Invoice downloaded', `Invoice for ${viewing.id} saved as PDF.`)}
              className="btn btn-primary w-full"
            >
              <Download className="h-4 w-4" /> Download PDF
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
