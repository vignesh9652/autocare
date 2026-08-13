import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, CheckCircle2, Clock, Star, Wrench, Wallet, Hourglass, CheckCheck, PiggyBank } from 'lucide-react';
import { bookingApi, mechanicApi, earningsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { KpiCard } from '@/components/ui/KpiCard';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/ui/Feedback';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export function MechanicOverview() {
  const user = useAuthStore((s) => s.user);
  const jobs = useQuery({ queryKey: ['assigned-jobs'], queryFn: bookingApi.getAssigned, refetchInterval: 20_000 });
  const profile = useQuery({ queryKey: ['my-mechanic', user?.userId], queryFn: () => mechanicApi.getByUser(user!.userId), enabled: !!user });
  const earnings = useQuery({ queryKey: ['my-earnings'], queryFn: earningsApi.getMine, refetchInterval: 20_000 });

  if (jobs.isLoading || profile.isLoading) return <CardSkeleton count={4} />;
  if (jobs.isError || profile.isError) return <ErrorState message="Could not load your dashboard" />;

  const assigned = jobs.data ?? [];
  const active = assigned.filter((j) => ['PENDING', 'ACCEPTED', 'IN_PROGRESS'].includes(j.status));
  const completed = assigned.filter((j) => j.status === 'COMPLETED' || j.status === 'PAYMENT_PENDING' || j.status === 'PAID').length;
  const me = profile.data;
  const e = earnings.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900 dark:text-ink-100">Hey {user?.name?.split(' ')[0]} 🔧</h1>
          <p className="mt-1 text-sm text-ink-500">Your service area: {me?.serviceArea ?? '—'} · {me?.skills.join(', ') || 'General'}</p>
        </div>
        <Link to="/mechanic/availability"><Button variant="outline"><Clock className="h-4 w-4" /> Toggle Availability</Button></Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Active Jobs" value={active.length} icon={<Wrench className="h-5 w-5" />} accent="brand" />
        <KpiCard label="Completed" value={completed} icon={<CheckCircle2 className="h-5 w-5" />} accent="emerald" />
        <KpiCard label="Rating" value={me?.averageRating ? `★ ${me.averageRating.toFixed(1)}` : '—'} icon={<Star className="h-5 w-5" />} accent="amber" />
        <KpiCard label="Total Jobs" value={me?.totalJobsCompleted ?? 0} icon={<ClipboardList className="h-5 w-5" />} accent="sky" />
      </div>

      {/* Earnings */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-ink-900 dark:text-ink-100">My Earnings</h2>
          <span className="text-xs font-semibold text-ink-400">Paid through the AutoCare platform</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Total Earnings" value={formatCurrency(e?.totalEarnings)} icon={<Wallet className="h-5 w-5" />} accent="brand" />
          <KpiCard label="Pending" value={formatCurrency(e?.pendingEarnings)} icon={<Hourglass className="h-5 w-5" />} accent="amber" />
          <KpiCard label="Completed" value={formatCurrency(e?.completedEarnings)} icon={<CheckCheck className="h-5 w-5" />} accent="emerald" />
          <KpiCard label="Available Balance" value={formatCurrency(e?.availableBalance)} icon={<PiggyBank className="h-5 w-5" />} accent="sky" />
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-ink-900 dark:text-ink-100">Assigned Jobs</h2>
          <Link to="/mechanic/jobs" className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400">View all →</Link>
        </div>
        {assigned.length === 0 ? (
          <EmptyState icon={<ClipboardList className="h-6 w-6" />} title="No jobs yet" description="New bookings near you will show up here instantly." />
        ) : (
          <div className="space-y-3">
            {assigned.slice(0, 4).map((j) => (
              <div key={j.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold text-ink-900 dark:text-ink-100">{j.serviceType}</p>
                  <p className="text-xs text-ink-400">{formatDateTime(j.scheduledAt)} · {j.address.slice(0, 48)}{j.address.length > 48 ? '…' : ''}</p>
                </div>
                <div className="flex items-center gap-3">
                  {j.status === 'PAID' && j.platformCommission != null && j.mechanicEarning != null ? (
                    <div className="rounded-xl bg-ink-50 px-3 py-1.5 text-right text-[11px] leading-tight dark:bg-ink-800/60">
                      <p className="font-bold text-ink-900 dark:text-ink-100">{formatCurrency(j.finalAmount ?? j.estimatedAmount)} <span className="font-medium text-ink-400">service</span></p>
                      <p className="text-ink-500">Commission <span className="font-semibold text-amber-600 dark:text-amber-400">−{formatCurrency(j.platformCommission)}</span></p>
                      <p className="font-semibold text-emerald-600 dark:text-emerald-400">You earn {formatCurrency(j.mechanicEarning)}</p>
                    </div>
                  ) : (
                    j.finalAmount != null && <span className="text-sm font-bold text-ink-900 dark:text-ink-100">{formatCurrency(j.finalAmount)}</span>
                  )}
                  <StatusBadge kind="booking" status={j.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
