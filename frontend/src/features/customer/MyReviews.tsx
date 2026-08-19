import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { bookingApi, reviewApi, getErrorMessage } from '@/lib/api';
import { toast } from '@/stores/toast-store';
import { formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Stars } from '@/components/ui/Stars';
import { Textarea } from '@/components/ui/Input';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/ui/Feedback';

export function MyReviews() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['my-bookings'], queryFn: bookingApi.getMine });

  const [openId, setOpenId] = useState<number | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const submit = useMutation({
    mutationFn: () => reviewApi.create({ bookingId: openId!, rating, comment: comment || undefined }),
    onSuccess: () => {
      toast('Thanks for your review!', 'success');
      setOpenId(null);
      setRating(5);
      setComment('');
      void qc.invalidateQueries({ queryKey: ['my-bookings'] });
    },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  if (isLoading) return <CardSkeleton count={3} />;
  if (isError) return <ErrorState message="Could not load bookings" onRetry={() => refetch()} />;

  const completed = (data ?? []).filter((b) => b.status === 'COMPLETED');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink-900 dark:text-ink-100">My Reviews</h1>
        <p className="mt-1 text-sm text-ink-500">Rate the mechanics who serviced your vehicle.</p>
      </div>

      {completed.length === 0 ? (
        <EmptyState icon={<Star className="h-6 w-6" />} title="Nothing to review yet" description="Completed bookings will appear here so you can rate them." />
      ) : (
        <div className="space-y-3">
          {completed.map((b) => (
            <div key={b.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-ink-900 dark:text-ink-100">{b.serviceType}</p>
                  <p className="text-xs text-ink-400">#{b.id} · {formatDateTime(b.scheduledAt)}</p>
                </div>
                {openId === b.id ? (
                  <Button variant="secondary" size="sm" onClick={() => setOpenId(null)}>Cancel</Button>
                ) : (
                  <Button size="sm" onClick={() => setOpenId(b.id)}><Star className="h-4 w-4" /> Rate this service</Button>
                )}
              </div>

              {openId === b.id && (
                <div className="mt-5 space-y-4 rounded-2xl bg-ink-50 p-5 dark:bg-ink-800/50">
                  <div>
                    <p className="mb-2 text-sm font-semibold text-ink-700 dark:text-ink-300">Your rating</p>
                    <Stars rating={rating} interactive size={28} onChange={setRating} />
                  </div>
                  <Textarea id={`comment-${b.id}`} label="Comment (optional)" placeholder="How was the service?" value={comment} onChange={(e) => setComment(e.target.value)} />
                  <Button onClick={() => submit.mutate()} loading={submit.isPending}>Submit Review</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
