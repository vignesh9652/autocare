import Stars from './Stars';
import { formatDateTime } from '@/utils/format';
import type { Review } from '@/types';

interface ReviewViewProps {
  review: Review;
}

/** Read-only submitted review (stars, comment, date). */
export default function ReviewView({ review }: ReviewViewProps) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-900/50 p-4">
      <div className="flex items-center justify-between">
        <Stars value={review.rating} size="sm" />
        <span className="text-xs text-slate-500">{formatDateTime(review.createdAt)}</span>
      </div>
      {review.comment ? (
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{review.comment}</p>
      ) : (
        <p className="mt-2 text-sm italic text-slate-500">No comment left.</p>
      )}
    </div>
  );
}
