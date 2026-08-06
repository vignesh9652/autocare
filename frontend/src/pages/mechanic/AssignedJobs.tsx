import { useMemo, useState } from 'react';
import { CalendarClock, Check, ClipboardList, MapPin, Play, X } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/Button';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { useApiData } from '@/hooks/useApiData';
import { getMechanicBookings, updateBookingStatus } from '@/api/bookingApi';
import type { Booking, BookingStatus } from '@/types';
import { formatDateTime } from '@/utils/format';
import { bookingStatusVariant } from '@/utils/status';

export default function AssignedJobs() {
  const bookings = useApiData(() => getMechanicBookings(), []);
  const [busyId, setBusyId] = useState<number | null>(null);
  const { success, error } = useToast();

  // Requests still awaiting a decision or already accepted.
  const jobs = useMemo(
    () =>
      (bookings.data ?? []).filter((b) => b.status === 'PENDING' || b.status === 'ACCEPTED'),
    [bookings.data],
  );

  const act = async (b: Booking, status: BookingStatus, message: string) => {
    setBusyId(b.id);
    try {
      await updateBookingStatus(b.id, status);
      success(message, `#${b.id} · ${b.serviceType}`);
      bookings.refresh();
    } catch {
      error('Could not update booking', `#${b.id} could not be moved to ${status.replace('_', ' ')}.`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Assigned Jobs"
        subtitle="Accept, reject and start the repairs assigned to you"
        icon={<ClipboardList className="h-5 w-5" />}
      />

      {bookings.loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="card h-32 animate-pulse" />)}
        </div>
      ) : jobs.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<ClipboardList className="h-9 w-9" />}
            title="No jobs waiting on you"
            description="Booking requests assigned to you appear here — accept them to start the job, or reject ones you can't take."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((b) => (
            <div key={b.id} className="card flex flex-wrap items-center gap-4 p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                <ClipboardList className="h-5 w-5" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {b.serviceType} <span className="font-normal text-slate-400">· #{b.id}</span>
                  </p>
                  <Badge variant={bookingStatusVariant(b.status)} dot>{b.status.replace('_', ' ')}</Badge>
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

              <div className="flex shrink-0 items-center gap-2">
                {b.status === 'PENDING' && (
                  <>
                    <Button size="sm" onClick={() => act(b, 'ACCEPTED', 'Job accepted')}>
                      <Check className="h-4 w-4" /> Accept
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => act(b, 'REJECTED', 'Job rejected')}>
                      <X className="h-4 w-4" /> Reject
                    </Button>
                  </>
                )}
                {b.status === 'ACCEPTED' && (
                  <Button size="sm" onClick={() => act(b, 'IN_PROGRESS', 'Repair started')}>
                    <Play className="h-4 w-4" /> Start Repair
                  </Button>
                )}
                {busyId === b.id && <span className="text-xs text-slate-400">Updating…</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
