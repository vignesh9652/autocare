import { useMemo, useState, type FormEvent } from 'react';
import { MessageSquareQuote, Send, Star, Upload } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/Button';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { useApiData } from '@/hooks/useApiData';
import { getBookings } from '@/api/bookingApi';
import { getMechanics } from '@/api/mechanicApi';
import { createReview, getReviewForBooking } from '@/api/reviewApi';
import type { Review } from '@/types';
import { formatDate } from '@/utils/format';
import { cn } from '@/utils/cn';

interface MyReview {
  bookingId: number;
  mechanicName: string;
  rating: number;
  comment: string;
  date: string;
  service: string;
}

export default function CustomerReviews() {
  const bookings = useApiData(() => getBookings(), []);
  const mechanics = useApiData(() => getMechanics(), []);
  const [bookingId, setBookingId] = useState<number | ''>('');
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { success, warning, error } = useToast();

  const completedBookings = useMemo(
    () => (bookings.data ?? []).filter((b) => b.status === 'COMPLETED'),
    [bookings.data],
  );

  const mechanicMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const m of mechanics.data ?? []) map.set(m.id, m.name);
    return map;
  }, [mechanics.data]);

  const selectedBooking = completedBookings.find((b) => b.id === Number(bookingId));
  const selectedMechanicName = selectedBooking?.mechanicId != null
    ? mechanicMap.get(selectedBooking.mechanicId) ?? `Mechanic #${selectedBooking.mechanicId}`
    : '';

  // Load the reviews the user has already written (one per booking).
  const existing = useApiData(
    async () => {
      const results = await Promise.allSettled(
        (bookings.data ?? []).map((b) => getReviewForBooking(b.id)),
      );
      // getReviewForBooking 404s when a booking has no review yet — those are
      // skipped; only real reviews are collected.
      const found: Review[] = [];
      for (const r of results) {
        if (r.status === 'fulfilled') found.push(r.value);
      }
      return found;
    },
    [bookings.data],
  );

  const myReviews = useMemo<MyReview[]>(
    () =>
      (existing.data ?? []).map((r) => ({
        bookingId: r.bookingId,
        mechanicName: mechanicMap.get(r.mechanicId) ?? `Mechanic #${r.mechanicId}`,
        rating: r.rating,
        comment: r.comment ?? '',
        date: r.createdAt?.slice(0, 10) ?? '',
        service: completedBookings.find((b) => b.id === r.bookingId)?.serviceType ?? 'Service',
      })),
    [existing.data, mechanicMap, completedBookings],
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!bookingId) {
      warning('Pick a booking', 'Select the completed booking you want to review.');
      return;
    }
    if (rating === 0) {
      warning('Select a rating', 'Please rate the mechanic before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      await createReview({
        bookingId: Number(bookingId),
        rating,
        comment: comment.trim() || undefined,
      });
      success('Review submitted', `Thanks for rating ${selectedMechanicName || 'your mechanic'}!`);
      setComment('');
      setRating(0);
      setFiles([]);
      setBookingId('');
      existing.refresh();
    } catch (err) {
      error('Could not submit review', 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Reviews & Ratings"
        subtitle="Rate your mechanics and help the community choose better"
        icon={<MessageSquareQuote className="h-5 w-5" />}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Write a review */}
        <form onSubmit={handleSubmit} className="card h-fit p-6">
          <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-slate-100">Write a review</h3>

          <div className="mb-4">
            <label className="label">Completed booking</label>
            {completedBookings.length === 0 ? (
              <EmptyState
                title="No completed bookings yet"
                description="You can review a service once your booking is completed."
              />
            ) : (
              <select className="select" value={bookingId} onChange={(e) => setBookingId(Number(e.target.value))}>
                <option value="">Choose a booking…</option>
                {completedBookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    #{b.id} · {b.serviceType}
                    {b.mechanicId != null ? ` · ${mechanicMap.get(b.mechanicId) ?? `Mechanic #${b.mechanicId}`}` : ''}
                  </option>
                ))}
              </select>
            )}
            {selectedMechanicName && (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Reviewing <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedMechanicName}</span>
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className="label">Your rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  aria-label={`${star} star${star > 1 ? 's' : ''}`}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      'h-7 w-7 transition-colors',
                      (hover || rating) >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600',
                    )}
                  />
                </button>
              ))}
              <span className="ml-2 self-center text-sm font-bold text-slate-700 dark:text-slate-200">
                {rating > 0 ? `${rating}.0 / 5` : 'Tap to rate'}
              </span>
            </div>
          </div>

          <div className="mb-4">
            <label className="label">Your experience</label>
            <textarea
              className="input min-h-28 resize-y"
              placeholder="How was the service? Was the mechanic transparent about costs?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <div className="mb-5">
            <label className="label">Upload photos (optional)</label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-4 py-3 text-xs font-medium text-slate-500 transition-colors hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:text-slate-400">
              <Upload className="h-4 w-4" />
              {files.length > 0 ? `${files.length} photo(s) selected` : 'Add photos of the work done'}
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
            </label>
          </div>

          <Button type="submit" className="w-full" disabled={submitting || completedBookings.length === 0}>
            <Send className="h-4 w-4" /> {submitting ? 'Submitting…' : 'Submit Review'}
          </Button>
        </form>

        {/* My reviews */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            My Reviews <span className="font-normal text-slate-400">({myReviews.length})</span>
          </h3>
          {myReviews.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={<MessageSquareQuote className="h-9 w-9" />}
                title="No reviews yet"
                description="Reviews you write for completed bookings will appear here."
              />
            </div>
          ) : (
            myReviews.map((r) => (
              <div key={r.bookingId} className="card p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={r.mechanicName} />
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{r.mechanicName}</p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className="flex text-amber-400" aria-label={`${r.rating} stars`}>
                          {'★'.repeat(r.rating)}
                          <span className="text-slate-300 dark:text-slate-600">{'★'.repeat(5 - r.rating)}</span>
                        </span>
                        <span className="text-xs text-slate-400">{formatDate(r.date)}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="neutral">{r.service}</Badge>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">"{r.comment}"</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
