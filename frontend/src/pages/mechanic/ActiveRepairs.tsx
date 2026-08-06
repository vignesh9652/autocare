import { useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, Hammer, MapPin } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/Button';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { useApiData } from '@/hooks/useApiData';
import { getMechanicBookings, updateBookingStatus } from '@/api/bookingApi';
import type { Booking } from '@/types';
import { formatDateTime } from '@/utils/format';
import { bookingStatusVariant } from '@/utils/status';

export default function ActiveRepairs() {
  const bookings = useApiData(() => getMechanicBookings(), []);
  const [busyId, setBusyId] = useState<number | null>(null);
  const { success, error } = useToast();

  const repairs = useMemo(
    () => (bookings.data ?? []).filter((b) => b.status === 'IN_PROGRESS'),
    [bookings.data],
  );

  const complete = async (b: Booking) => {
    setBusyId(b.id);
    try {
      await updateBookingStatus(b.id, 'COMPLETED');
      success('Job completed', `#${b.id} · ${b.serviceType} marked as done.`);
      bookings.refresh();
    } catch {
      error('Could not complete job', `#${b.id} could not be completed.`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Active Repairs"
        subtitle="Repairs you're currently working on"
        icon={<Hammer className="h-5 w-5" />}
      />

      {bookings.loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="card h-32 animate-pulse" />)}
        </div>
      ) : repairs.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Hammer className="h-9 w-9" />}
            title="No active repairs"
            description="Jobs you start from Assigned Jobs will be tracked here until you mark them complete."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {repairs.map((b) => (
            <div key={b.id} className="card flex flex-wrap items-center gap-4 p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400">
                <Hammer className="h-5 w-5" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {b.serviceType} <span className="font-normal text-slate-400">· #{b.id}</span>
                  </p>
                  <Badge variant={bookingStatusVariant(b.status)} dot>In progress</Badge>
                </div>
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

              <Button
                size="sm"
                onClick={() => complete(b)}
                disabled={busyId === b.id}
                className="shrink-0"
              >
                <CheckCircle2 className="h-4 w-4" /> {busyId === b.id ? 'Completing…' : 'Mark Complete'}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
