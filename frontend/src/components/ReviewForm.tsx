import { useState } from 'react';
import Button from './Button';
import { getApiErrorMessage } from '@/api/client';
import { createReview } from '@/api/reviewApi';
import type { Review } from '@/types';

interface ReviewFormProps {
  bookingId: number;
  /** Called with the created review on success — parent swaps to a read-only view. */
  onSubmitted: (review: Review) => void;
  submitLabel?: string;
}

/** 5 clickable stars + comment textarea; posts via createReview. */
export default function ReviewForm({
  bookingId,
  onSubmitted,
  submitLabel = 'Submit Review',
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) {
      setError('Please select a star rating');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const review = await createReview({
        bookingId,
        rating,
        comment: comment.trim() || undefined,
      });
      onSubmitted(review);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to submit review. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="mb-3">
        <span className="label">Your rating</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              aria-label={`${value} star${value === 1 ? '' : 's'}`}
              onClick={() => setRating(value)}
              onMouseEnter={() => setHovered(value)}
              onMouseLeave={() => setHovered(0)}
              className="text-2xl transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
            >
              <span
                className={value <= (hovered || rating) ? 'text-amber-400' : 'text-slate-600'}
                aria-hidden
              >
                ★
              </span>
            </button>
          ))}
          <span className="ml-2 self-center text-sm text-slate-400">
            {rating > 0 ? `${rating}/5` : 'Tap to rate'}
          </span>
        </div>
      </div>

      <div className="mb-3">
        <label htmlFor="review-comment" className="label">
          Comment <span className="text-slate-600">(optional)</span>
        </label>
        <textarea
          id="review-comment"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share how the service went…"
          className="input resize-y"
        />
      </div>

      {error && (
        <p role="alert" className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <Button type="submit" loading={submitting} disabled={rating < 1}>
        {submitting ? 'Submitting…' : submitLabel}
      </Button>
    </form>
  );
}
