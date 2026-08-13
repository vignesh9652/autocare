import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MapPin, Check, X, Play, CheckCircle2 } from 'lucide-react';
import { bookingApi, getErrorMessage } from '@/lib/api';
import { toast } from '@/stores/toast-store';
import { BookingStatus } from '@/types';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/ui/Feedback';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export function AssignedJobs() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['assigned-jobs'],
    queryFn: bookingApi.getAssigned,
    refetchInterval: 20_000,
  });

  const update = useMutation({
    mutationFn: ({ id, status }: { id: number; status: BookingStatus }) => bookingApi.updateStatus(id, status),
    onSuccess: (_d, v) => {
      toast(`Job marked ${v.status.replace('_', ' ')}`, 'success');
      void qc.invalidateQueries({ queryKey: ['assigned-jobs'] });
    },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  if (isLoading) return <CardSkeleton count={3} />;
  if (isError) return <ErrorState message="Could not load jobs" onRetry={() => refetch()} />;

  const jobs = data ?? [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink-900 dark:text-ink-100">Assigned Jobs</h1>
        <p className="mt-1 text-sm text-ink-500">Accept, reject, and update the jobs assigned to you.</p>
      </div>

      {jobs.length === 0 ? (
        <EmptyState icon={<MapPin className="h-6 w-6" />} title="No assigned jobs" description="New bookings in your area will appear here automatically." />
      ) : (
        <div className="space-y-4">
          {jobs.map((j) => (
            <motion.div key={j.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-ink-900 dark:text-ink-100">{j.serviceType}</p>
                    <p className="text-xs text-ink-400">Booking #{j.id} · Vehicle #{j.vehicleId}</p>
                    <p className="mt-1 text-xs text-ink-500">🕐 {formatDateTime(j.scheduledAt)}</p>
                    <p className="mt-1 text-xs text-ink-500">📍 {j.address}</p>
                  </div>
                </div>
                <StatusBadge kind="booking" status={j.status} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-100 pt-4 dark:border-ink-800">
                {j.status === 'PENDING' && (
                  <>
                    <Button size="sm" onClick={() => update.mutate({ id: j.id, status: 'ACCEPTED' })} loading={update.isPending}>
                      <Check className="h-4 w-4" /> Accept
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => update.mutate({ id: j.id, status: 'REJECTED' })}>
                      <X className="h-4 w-4" /> Reject
                    </Button>
                  </>
                )}
                {j.status === 'ACCEPTED' && (
                  <Button size="sm" onClick={() => update.mutate({ id: j.id, status: 'IN_PROGRESS' })}>
                    <Play className="h-4 w-4" /> Start Service
                  </Button>
                )}
                {j.status === 'IN_PROGRESS' && (
                  <Button size="sm" onClick={() => update.mutate({ id: j.id, status: 'COMPLETED' })}>
                    <CheckCircle2 className="h-4 w-4" /> Mark Completed
                  </Button>
                )}
                {j.status === 'COMPLETED' && (
                  <div className="text-sm">
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400">✓ Job completed — awaiting customer payment</p>
                    <p className="mt-0.5 text-xs text-ink-400">Final amount {formatCurrency(j.finalAmount ?? j.estimatedAmount)} · payout releases once paid</p>
                  </div>
                )}
                {j.status === 'PAYMENT_PENDING' && (
                  <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">⏳ Customer payment in progress</p>
                )}
                {j.status === 'PAID' && (
                  <div className="rounded-xl bg-emerald-50 px-3 py-2 text-xs dark:bg-emerald-500/10">
                    <p className="font-bold text-emerald-700 dark:text-emerald-400">✓ Paid — earnings credited</p>
                    <p className="mt-1 text-ink-600 dark:text-ink-300">
                      Service {formatCurrency(j.finalAmount ?? j.estimatedAmount)} ·
                      AutoCare commission −{formatCurrency(j.platformCommission)} ·
                      <span className="font-bold"> you earn {formatCurrency(j.mechanicEarning)}</span>
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
