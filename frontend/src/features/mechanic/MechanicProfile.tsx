import { useQuery } from '@tanstack/react-query';
import { Star, MapPin, Wrench, Award } from 'lucide-react';
import { mechanicApi, reviewApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { Stars } from '@/components/ui/Stars';
import { CardSkeleton, ErrorState } from '@/components/ui/Feedback';
import { timeAgo, initials } from '@/lib/utils';

export function MechanicProfile() {
  const user = useAuthStore((s) => s.user);
  const profile = useQuery({ queryKey: ['my-mechanic', user?.userId], queryFn: () => mechanicApi.getByUser(user!.userId), enabled: !!user });
  const reviews = useQuery({ queryKey: ['my-reviews'], queryFn: () => reviewApi.getForMechanic(profile.data?.id ?? 0), enabled: !!profile.data });

  if (profile.isLoading) return <CardSkeleton count={2} />;
  if (profile.isError || !profile.data) return <ErrorState message="Could not load your profile" />;

  const me = profile.data;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="card overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-brand-600 via-amber-500 to-brand-700" />
        <div className="px-6 pb-6">
          <div className="-mt-10 mb-4 flex items-end justify-between">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-ink-100 text-lg font-extrabold text-ink-600 dark:border-ink-900 dark:bg-ink-800">
              {initials(user?.name ?? 'M')}
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-2 dark:bg-amber-500/10">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              <span className="text-lg font-extrabold text-ink-900 dark:text-ink-100">{me.averageRating ? me.averageRating.toFixed(1) : '—'}</span>
            </div>
          </div>

          <h1 className="text-xl font-extrabold text-ink-900 dark:text-ink-100">{user?.name}</h1>
          <p className="text-sm text-ink-400">{me.email} · {me.phone}</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-2 rounded-xl bg-ink-50 p-3 text-sm dark:bg-ink-800/60">
              <MapPin className="h-4 w-4 text-brand-500" /> {me.serviceArea}
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-ink-50 p-3 text-sm dark:bg-ink-800/60">
              <Wrench className="h-4 w-4 text-brand-500" /> {me.skills.join(', ')}
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-ink-50 p-3 text-sm dark:bg-ink-800/60">
              <Award className="h-4 w-4 text-brand-500" /> {me.totalJobsCompleted} jobs done
            </div>
          </div>
        </div>
      </div>

      <div className="card mt-6 p-6">
        <h2 className="mb-4 text-base font-bold text-ink-900 dark:text-ink-100">Customer Reviews</h2>
        {!reviews.data || reviews.data.length === 0 ? (
          <p className="text-sm text-ink-400">No reviews yet — keep up the great work!</p>
        ) : (
          <div className="space-y-4">
            {reviews.data.map((r) => (
              <div key={r.id} className="border-b border-ink-100 pb-4 last:border-0 dark:border-ink-800">
                <div className="flex items-center justify-between">
                  <Stars rating={r.rating} size={14} />
                  <span className="text-xs text-ink-400">{timeAgo(r.createdAt)}</span>
                </div>
                {r.comment && <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
