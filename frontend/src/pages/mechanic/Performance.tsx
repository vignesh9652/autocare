import { CheckCircle2, Star, ThumbsUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import PageHeader from '@/components/ui/PageHeader';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { ProgressRing } from '@/components/charts';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { useApiData } from '@/hooks/useApiData';
import { getMechanics } from '@/api/mechanicApi';
import { getReviewsForMechanic } from '@/api/reviewApi';
import { formatDate } from '@/utils/format';

export default function Performance() {
  const { user } = useAuth();
  const mechanics = useApiData(() => getMechanics(), []);

  const mine =
    (mechanics.data ?? []).find((m) => m.email.toLowerCase() === (user?.email ?? '').toLowerCase()) ??
    null;

  const reviews = useApiData(
    () => (mine ? getReviewsForMechanic(mine.id) : Promise.resolve([])),
    [mine?.id],
  );

  const loading = mechanics.loading;
  const rating = mine?.averageRating ?? 0;
  const ratingPct = Math.round((rating / 5) * 100);
  const jobs = mine?.totalJobsCompleted ?? 0;
  const reviewList = reviews.data ?? [];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Performance"
        subtitle="Your quality, reliability and customer satisfaction metrics"
        icon={<ThumbsUp className="h-5 w-5" />}
      />

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full lg:col-span-2" />
        </div>
      ) : !mine ? (
        <div className="card">
          <EmptyState
            title="No mechanic profile linked"
            description="Ask an admin to link a mechanic profile to your account — performance metrics will show up here."
          />
        </div>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Rating ring */}
            <div className="card flex flex-col items-center justify-center p-6 text-center">
              <ProgressRing value={ratingPct} size={150} strokeWidth={12} color="#f59e0b" label="Rating score" />
              <p className="mt-4 text-2xl font-extrabold text-slate-900 dark:text-white">
                {rating.toFixed(1)} / 5.0
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Based on {reviewList.length} customer review{reviewList.length === 1 ? '' : 's'}
              </p>
              <div className="mt-4 flex gap-2">
                <Badge variant={mine.availabilityStatus === 'AVAILABLE' ? 'success' : 'neutral'} dot>
                  {mine.availabilityStatus.replace('_', ' ')}
                </Badge>
                <Badge variant="brand">Verified</Badge>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
              <div className="card p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <p className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">{jobs}</p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Jobs Completed</p>
                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div className="h-full w-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
                </div>
              </div>
              <div className="card p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
                  <Star className="h-5 w-5" />
                </span>
                <p className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">{rating.toFixed(1)}★</p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Average Rating · {reviewList.length} reviews
                </p>
              </div>
              <div className="card p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                  <ThumbsUp className="h-5 w-5" />
                </span>
                <p className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">{mine.skills.length}</p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Specialised skills</p>
              </div>
              <div className="card p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <p className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">
                  {mine.serviceArea}
                </p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Service area</p>
              </div>
            </div>
          </div>

          {/* Latest customer reviews */}
          <div className="card mt-6 p-5">
            <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-slate-100">Latest Customer Reviews</h3>
            {reviewList.length === 0 ? (
              <EmptyState
                title="No reviews yet"
                description="When customers review your work, it will appear here."
              />
            ) : (
              <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                {reviewList.map((r) => (
                  <div key={r.id} className="rounded-xl border border-slate-100 p-3.5 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <Avatar name="Customer" size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                          Booking #{r.bookingId}
                        </p>
                        <p className="flex text-[11px] text-amber-400">
                          {'★'.repeat(r.rating)}
                          <span className="text-slate-300 dark:text-slate-600">{'★'.repeat(5 - r.rating)}</span>
                        </p>
                      </div>
                      <span className="text-[11px] text-slate-400">{formatDate(r.createdAt)}</span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      "{r.comment ?? 'No comment provided.'}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
