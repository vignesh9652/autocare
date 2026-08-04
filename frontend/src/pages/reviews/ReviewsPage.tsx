import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { getMyBookings } from '@/api/bookingApi';
import { getMechanics } from '@/api/mechanicApi';
import { createReview, getReviewsByMechanic } from '@/api/reviewApi';
import { getApiErrorMessage } from '@/api/client';
import { Button, Card, Input, Modal, Spinner, StatusBadge } from '@/components';
import { formatDateTime } from '@/utils/format';
import type { Booking, Mechanic, Review } from '@/types';

export default function ReviewsPage() {
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedMechanicId, setSelectedMechanicId] = useState<number | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ bookingId: '', rating: '5', comment: '' });
  const [saving, setSaving] = useState(false);

  const loadMechanics = useCallback(async () => {
    try {
      setMechanics(await getMechanics());
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load mechanics'));
    }
  }, []);

  const loadReviews = useCallback(async (mechanicId: number) => {
    setLoading(true);
    setError('');
    try {
      setReviews(await getReviewsByMechanic(mechanicId));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load reviews'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMechanics();
  }, [loadMechanics]);

  useEffect(() => {
    if (selectedMechanicId) void loadReviews(selectedMechanicId);
  }, [selectedMechanicId, loadReviews]);

  const openCreate = async () => {
    setError('');
    try {
      setBookings(await getMyBookings());
      setModalOpen(true);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load bookings for review'));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createReview({
        bookingId: Number(form.bookingId),
        rating: Number(form.rating),
        comment: form.comment.trim() || undefined,
      });
      setModalOpen(false);
      setForm({ bookingId: '', rating: '5', comment: '' });
      if (selectedMechanicId) await loadReviews(selectedMechanicId);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to submit review'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-page py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Reviews</h1>
          <p className="mt-1 text-sm text-slate-400">See what customers say about mechanics</p>
        </div>
        <Button onClick={openCreate}>+ Write Review</Button>
      </div>

      {/* Mechanic picker */}
      <div className="mb-6 flex flex-wrap gap-2">
        <span className="py-2 text-sm text-slate-400">Mechanic:</span>
        {mechanics.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelectedMechanicId(m.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              selectedMechanicId === m.id
                ? 'bg-brand-600 text-white'
                : 'border border-slate-700 text-slate-300 hover:border-brand-500'
            }`}
          >
            {m.name}
          </button>
        ))}
        {mechanics.length === 0 && <p className="py-2 text-sm text-slate-500">No mechanics available.</p>}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {!selectedMechanicId ? (
        <Card className="py-16 text-center">
          <p className="text-slate-400">Select a mechanic to see their reviews.</p>
        </Card>
      ) : loading ? (
        <Spinner label="Loading reviews…" className="py-20" />
      ) : reviews.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="text-slate-400">No reviews for this mechanic yet.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <Card key={r.id} hoverable>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400" aria-label={`${r.rating} stars`}>
                    {'★'.repeat(r.rating)}
                    <span className="text-slate-600">{'★'.repeat(5 - r.rating)}</span>
                  </span>
                  <span className="text-sm font-semibold text-slate-200">{r.rating}/5</span>
                </div>
                <StatusBadge status="COMPLETED" label={`Booking #${r.bookingId}`} />
              </div>
              {r.comment && <p className="mt-3 text-sm text-slate-300">{r.comment}</p>}
              <p className="mt-3 text-xs text-slate-500">{formatDateTime(r.createdAt)}</p>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        title="Write a Review"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button form="review-form" type="submit" loading={saving}>
              {saving ? 'Submitting…' : 'Submit Review'}
            </Button>
          </>
        }
      >
        <form id="review-form" onSubmit={handleSubmit}>
          {bookings.length === 0 ? (
            <p className="mb-4 rounded-lg bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
              You need at least one booking to review.
            </p>
          ) : (
            <div className="mb-4">
              <label className="label" htmlFor="r-booking">Booking</label>
              <select
                id="r-booking"
                className="input"
                required
                value={form.bookingId}
                onChange={(e) => setForm({ ...form, bookingId: e.target.value })}
              >
                <option value="">Select a booking…</option>
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    #{b.id} · {b.serviceType} · {b.status}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="mb-4">
            <label className="label" htmlFor="r-rating">Rating</label>
            <select
              id="r-rating"
              className="input"
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: e.target.value })}
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
          <Input
            label="Comment (optional)"
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
            placeholder="Share your experience…"
          />
        </form>
      </Modal>
    </div>
  );
}
