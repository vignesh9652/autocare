import { useEffect, useState } from 'react';
import ReviewView from './ReviewView';
import Spinner from './Spinner';
import { getApiErrorMessage } from '@/api/client';
import { getReviewsForMechanic } from '@/api/reviewApi';
import type { Review } from '@/types';

interface ReviewsListProps {
  mechanicId: number;
}

/** Fetches and lists a mechanic's reviews; empty state "No reviews yet". */
export default function ReviewsList({ mechanicId }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cancellation guard so a slow response for a previously selected mechanic
  // cannot overwrite the reviews of the currently selected one.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const list = await getReviewsForMechanic(mechanicId);
        if (!cancelled) setReviews(list);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Failed to load reviews'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mechanicId]);

  if (loading) return <Spinner size="sm" label="Loading reviews…" className="py-6" />;

  if (error) {
    return (
      <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        {error}
      </p>
    );
  }

  if (reviews.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-700 px-4 py-8 text-center text-sm text-slate-500">
        No reviews yet
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <ReviewView key={r.id} review={r} />
      ))}
    </div>
  );
}
