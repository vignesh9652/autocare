import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, Radio } from 'lucide-react';
import { mechanicApi, getErrorMessage } from '@/lib/api';
import { toast } from '@/stores/toast-store';
import { useAuthStore } from '@/stores/auth-store';
import { AvailabilityStatus } from '@/types';
import { cn } from '@/lib/utils';
import { CardSkeleton, ErrorState } from '@/components/ui/Feedback';

const OPTIONS: { value: AvailabilityStatus; label: string; desc: string; active: string }[] = [
  { value: 'AVAILABLE', label: 'Available', desc: 'You will receive new booking requests.', active: 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' },
  { value: 'BUSY', label: 'Busy', desc: 'Working on a job — no new assignments.', active: 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' },
  { value: 'OFFLINE', label: 'Offline', desc: 'Not accepting work right now.', active: 'border-ink-300 bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300' },
];

export function Availability() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-mechanic', user?.userId],
    queryFn: () => mechanicApi.getByUser(user!.userId),
    enabled: !!user,
  });

  const setStatus = useMutation({
    mutationFn: (availabilityStatus: AvailabilityStatus) => mechanicApi.updateAvailability(data!.id, availabilityStatus),
    onSuccess: (_d, v) => {
      toast(`Status set to ${v.toLowerCase()}`, 'success');
      void qc.invalidateQueries({ queryKey: ['my-mechanic', user?.userId] });
    },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  if (isLoading) return <CardSkeleton count={2} />;
  if (isError || !data) return <ErrorState message="Could not load your profile" onRetry={() => refetch()} />;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink-900 dark:text-ink-100">Availability</h1>
        <p className="mt-1 text-sm text-ink-500">Control when you receive job assignments.</p>
      </div>

      <div className="mb-6 flex items-center gap-3 rounded-2xl bg-ink-50 p-4 dark:bg-ink-800/60">
        <Clock className="h-5 w-5 text-brand-500" />
        <p className="text-sm text-ink-600 dark:text-ink-300">
          Current status: <span className="font-bold text-ink-900 dark:text-ink-100">{data.availabilityStatus}</span>
          {data.availabilityStatus === 'AVAILABLE' && <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400"><Radio className="h-3 w-3 animate-pulse" /> Receiving requests</span>}
        </p>
      </div>

      <div className="space-y-3">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            disabled={setStatus.isPending}
            onClick={() => setStatus.mutate(opt.value)}
            className={cn(
              'w-full rounded-2xl border-2 p-5 text-left transition hover:border-brand-400',
              data.availabilityStatus === opt.value ? opt.active : 'border-ink-100 dark:border-ink-700'
            )}
          >
            <div className="flex items-center justify-between">
              <p className="font-bold">{opt.label}</p>
              <span className={cn('h-5 w-5 rounded-full border-4', data.availabilityStatus === opt.value ? 'border-white bg-current' : 'border-ink-200 dark:border-ink-600')} />
            </div>
            <p className="mt-1 text-sm opacity-80">{opt.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
