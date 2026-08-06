import { useMemo } from 'react';
import { CalendarCheck, CalendarClock, IndianRupee, MapPin } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { useApiData } from '@/hooks/useApiData';
import { getMechanicBookings } from '@/api/bookingApi';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { bookingStatusVariant } from '@/utils/status';

export default function CompletedJobs() {
  const bookings = useApiData(() => getMechanicBookings(), []);

  const completed = useMemo(
    () => (bookings.data ?? []).filter((b) => b.status === 'COMPLETED'),
    [bookings.data],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Completed Jobs"
        subtitle={`${completed.length} finished service${completed.length === 1 ? '' : 's'}`}
        icon={<CalendarCheck className="h-5 w-5" />}
      />

      {bookings.loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="card h-28 animate-pulse" />)}
        </div>
      ) : completed.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<CalendarCheck className="h-9 w-9" />}
            title="Nothing completed yet"
            description="Jobs you finish will be listed here with their details and earnings."
          />
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {completed.map((b) => (
            <div key={b.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {b.serviceType} <span className="font-normal text-slate-400">· #{b.id}</span>
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="h-3.5 w-3.5" /> {formatDateTime(b.scheduledAt)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {b.address || 'Workshop pickup'}
                    </span>
                    <span>Vehicle #{b.vehicleId}</span>
                  </p>
                </div>
                <Badge variant={bookingStatusVariant(b.status)}>Completed</Badge>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-2.5 dark:bg-emerald-500/10">
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Job value</span>
                <span className="flex items-center gap-1 text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                  <IndianRupee className="h-4 w-4" />
                  {b.estimatedCost ? formatCurrency(b.estimatedCost) : '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
