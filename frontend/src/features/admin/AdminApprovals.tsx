import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { UserCheck, Check, X, Wrench, MapPin } from 'lucide-react';
import { adminApi, getErrorMessage } from '@/lib/api';
import { toast } from '@/stores/toast-store';
import { Button } from '@/components/ui/Button';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/ui/Feedback';
import { formatDate } from '@/lib/utils';

type PendingMechanic = {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  serviceArea?: string;
  skills?: string[] | string;
  createdAt?: string;
  user?: { id: number; name: string; email: string };
};

export function AdminApprovals() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-pending-mechanics'],
    queryFn: adminApi.pendingMechanics,
    refetchInterval: 30_000,
  });

  const rows = (data ?? []) as PendingMechanic[];

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['admin-pending-mechanics'] });
    void qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
  };

  const decide = useMutation({
    mutationFn: ({ id, approve }: { id: number; approve: boolean }) =>
      approve ? adminApi.approveMechanic(id) : adminApi.rejectMechanic(id),
    onSuccess: (_d, v) => {
      toast(v.approve ? 'Mechanic approved 🎉' : 'Mechanic rejected', v.approve ? 'success' : 'info');
      invalidate();
    },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  if (isLoading) return <CardSkeleton count={3} />;
  if (isError) return <ErrorState message="Could not load pending mechanics" onRetry={() => refetch()} />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink-900 dark:text-ink-100">Mechanic Approvals</h1>
        <p className="mt-1 text-sm text-ink-500">{rows.length} mechanic(s) waiting for your review.</p>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<UserCheck className="h-6 w-6" />} title="All caught up!" description="No pending mechanic applications right now." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((m) => {
            const skills = Array.isArray(m.skills) ? m.skills : m.skills ? String(m.skills).split(',').map((s) => s.trim()) : [];
            const name = m.name ?? m.user?.name ?? 'Unknown';
            const email = m.email ?? m.user?.email ?? '—';
            return (
              <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400">
                      <Wrench className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-ink-900 dark:text-ink-100">{name}</p>
                      <p className="text-xs text-ink-400">{email} · {m.phone ?? 'no phone'}</p>
                    </div>
                  </div>
                  {m.createdAt && <span className="text-xs text-ink-400">Applied {formatDate(m.createdAt)}</span>}
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {skills.map((s) => (
                    <span key={s} className="rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-600 dark:bg-ink-800 dark:text-ink-300">{s}</span>
                  ))}
                  {skills.length === 0 && <span className="text-xs text-ink-400">No skills listed</span>}
                </div>

                {m.serviceArea && (
                  <p className="mt-3 flex items-center gap-1.5 text-sm text-ink-500">
                    <MapPin className="h-4 w-4 text-brand-500" /> {m.serviceArea}
                  </p>
                )}

                <div className="mt-5 flex gap-2 border-t border-ink-100 pt-4 dark:border-ink-800">
                  <Button className="flex-1" size="sm" onClick={() => decide.mutate({ id: m.id, approve: true })} loading={decide.isPending}>
                    <Check className="h-4 w-4" /> Approve
                  </Button>
                  <Button variant="danger" className="flex-1" size="sm" onClick={() => decide.mutate({ id: m.id, approve: false })}>
                    <X className="h-4 w-4" /> Reject
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
