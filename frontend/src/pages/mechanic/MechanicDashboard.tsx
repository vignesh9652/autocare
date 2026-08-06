import { Link } from 'react-router-dom';
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Star,
  Wallet,
} from 'lucide-react';
import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApiData } from '@/hooks/useApiData';
import PageHeader from '@/components/ui/PageHeader';
import KpiCard from '@/components/ui/KpiCard';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { getMechanics } from '@/api/mechanicApi';
import { getMechanicBookings } from '@/api/bookingApi';
import { getReviewsForMechanic } from '@/api/reviewApi';
import { formatCurrency } from '@/utils/format';
import { bookingStatusVariant } from '@/utils/status';

export default function MechanicDashboard() {
  const { user } = useAuth();
  const mechanics = useApiData(() => getMechanics(), []);
  const bookings = useApiData(() => getMechanicBookings(), []);

  // Match the logged-in mechanic by email (the mechanic profile carries it).
  const mine =
    (mechanics.data ?? []).find((m) => m.email.toLowerCase() === (user?.email ?? '').toLowerCase()) ??
    null;

  const reviews = useApiData(
    () => (mine ? getReviewsForMechanic(mine.id) : Promise.resolve([])),
    [mine?.id],
  );

  const loading = mechanics.loading;

  const firstName = user?.email?.split('@')[0]?.replace(/[._-]/g, ' ') ?? 'there';
  const name = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  const avgRating = mine?.averageRating ?? 0;
  const jobsCompleted = mine?.totalJobsCompleted ?? 0;
  const ratingCount = reviews.data?.length ?? 0;

  // Live job metrics from the bookings assigned to this mechanic.
  const myBookings = bookings.data ?? [];
  const activeJobs = myBookings.filter((b) =>
    ['PENDING', 'ACCEPTED', 'IN_PROGRESS'].includes(b.status),
  ).length;
  const completedValue = useMemo(
    () =>
      myBookings
        .filter((b) => b.status === 'COMPLETED' && b.estimatedCost != null)
        .reduce((sum, b) => sum + (b.estimatedCost ?? 0), 0),
    [myBookings],
  );
  const schedule = useMemo(
    () =>
      [...myBookings]
        .sort((a, b) => (a.scheduledAt < b.scheduledAt ? 1 : -1))
        .slice(0, 5),
    [myBookings],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Good day, ${name} 🔧`}
        subtitle="Manage your jobs, track earnings and keep customers happy"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Assigned Jobs" value={activeJobs} icon={<ClipboardList className="h-5 w-5" />} accent="brand" loading={loading || bookings.loading} />
        <KpiCard label="Jobs Completed" value={jobsCompleted} icon={<CheckCircle2 className="h-5 w-5" />} accent="emerald" loading={loading} />
        <KpiCard label="Completed Value" value={completedValue ? formatCurrency(completedValue) : '—'} icon={<Wallet className="h-5 w-5" />} accent="violet" loading={bookings.loading} />
        <KpiCard label="Customer Rating" value={mine ? `${avgRating.toFixed(1)} ★` : '—'} icon={<Star className="h-5 w-5" />} accent="amber" loading={loading} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Left */}
        <div className="space-y-6 lg:col-span-2">
          {/* Today's schedule */}
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Recent Jobs</h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Your latest bookings, newest first
                </p>
              </div>
              <Link to="/mechanic/jobs" className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">
                View all →
              </Link>
            </div>
            {bookings.loading ? (
              <Skeleton className="h-40 w-full" />
            ) : schedule.length === 0 ? (
              <EmptyState
                icon={<CalendarDays className="h-8 w-8" />}
                title="No jobs assigned yet"
                description="When a customer books you, the job will show up here and in Assigned Jobs."
              />
            ) : (
              <div className="space-y-2.5">
                {schedule.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5 dark:border-slate-800">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                        {b.serviceType} <span className="font-normal text-slate-400">· #{b.id}</span>
                      </p>
                      <p className="truncate text-[11px] text-slate-400">
                        {b.scheduledAt?.slice(0, 10)} · Vehicle #{b.vehicleId}
                      </p>
                    </div>
                    <Badge variant={bookingStatusVariant(b.status)} dot>{b.status.replace('_', ' ')}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Profile summary */}
          <div className="card p-5">
            <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-slate-100">Your profile</h3>
            {loading ? (
              <Skeleton className="h-24 w-full" />
            ) : mine ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ['Name', mine.name],
                  ['Service area', mine.serviceArea],
                  ['Availability', mine.availabilityStatus.replace('_', ' ')],
                  ['Skills', mine.skills.join(', ')],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60">
                    <p className="font-medium text-slate-400 dark:text-slate-500">{k}</p>
                    <p className="mt-0.5 font-semibold text-slate-800 dark:text-slate-100">{v}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No mechanic profile is linked to your account yet — ask an admin to create one.
              </p>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="space-y-6">
          {/* Rating */}
          <div className="card p-5">
            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-slate-100">
              <Star className="h-4 w-4 text-amber-500" /> Customer Ratings
            </h3>
            {mine ? (
              <div className="text-center">
                <p className="text-4xl font-extrabold text-slate-900 dark:text-white">
                  {avgRating.toFixed(1)}
                </p>
                <p className="mt-1 flex justify-center gap-0.5 text-amber-400" aria-label={`${avgRating} out of 5`}>
                  {'★'.repeat(Math.round(avgRating))}
                  <span className="text-slate-300 dark:text-slate-600">{'★'.repeat(5 - Math.round(avgRating))}</span>
                </p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Based on {ratingCount} review{ratingCount === 1 ? '' : 's'}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">No rating data yet.</p>
            )}
          </div>

          {/* Notifications */}
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Notifications</h3>
              <Link to="/mechanic/notifications" className="text-xs font-semibold text-brand-600 dark:text-brand-400">View all</Link>
            </div>
            <EmptyState
              title="No updates"
              description="Notifications appear here when events occur (e.g. a new job or payment)."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
