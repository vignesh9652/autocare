import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getBooking, updateBookingStatus } from '@/api/bookingApi';
import { getVehicle } from '@/api/vehicleApi';
import { getMechanic } from '@/api/mechanicApi';
import { getRecommendationsForBooking, decideRecommendation } from '@/api/sparePartsApi';
import { getPayments } from '@/api/paymentApi';
import { getReviewForBooking, isNoReviewError } from '@/api/reviewApi';
import { getApiErrorMessage } from '@/api/client';
import {
  Button,
  Card,
  Modal,
  RecommendationCard,
  ReviewForm,
  ReviewView,
  Spinner,
  Stars,
  StatusBadge,
} from '@/components';
import { formatCurrency, formatDateTime, formatRating } from '@/utils/format';
import type {
  Booking,
  BookingStatus,
  Mechanic,
  Payment,
  Recommendation,
  RecommendationStatus,
  Review,
  Vehicle,
} from '@/types';

const POLL_MS = 15_000;

const STATUS_STEPS: BookingStatus[] = ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'];

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const bookingId = Number(id);

  const [booking, setBooking] = useState<Booking | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [mechanic, setMechanic] = useState<Mechanic | null | 'loading'>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [review, setReview] = useState<Review | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [decisionBusy, setDecisionBusy] = useState<number | null>(null);

  const terminal =
    booking?.status === 'COMPLETED' ||
    booking?.status === 'CANCELLED' ||
    booking?.status === 'REJECTED';

  /* ------------------------------ Data load ----------------------------- */
  // Cancellation guard so an in-flight load can't clobber state after the
  // route param changes (React Router reuses this component across ids).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const b = await getBooking(bookingId);
        if (cancelled) return;
        setBooking(b);

        try {
          const v = await getVehicle(b.vehicleId);
          if (!cancelled) setVehicle(v);
        } catch {
          if (!cancelled) setVehicle(null);
        }
        try {
          const recs = await getRecommendationsForBooking(b.id);
          if (!cancelled) setRecommendations(recs);
        } catch {
          if (!cancelled) setRecommendations([]);
        }
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Failed to load booking'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  // Payments for this booking (to decide if "Pay Now" should be shown).
  useEffect(() => {
    let cancelled = false;
    getPayments()
      .then((ps) => {
        if (!cancelled) {
          setPayments(
            ps.filter((p) => p.referenceType === 'BOOKING' && p.referenceId === bookingId),
          );
        }
      })
      .catch(() => {
        /* payment section simply won't show */
      });
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  // Mechanic info whenever the assigned mechanic changes.
  useEffect(() => {
    if (!booking?.mechanicId) {
      setMechanic(null);
      return;
    }
    let cancelled = false;
    setMechanic('loading');
    getMechanic(booking.mechanicId)
      .then((m) => {
        if (!cancelled) setMechanic(m);
      })
      .catch(() => {
        if (!cancelled) setMechanic(null);
      });
    return () => {
      cancelled = true;
    };
  }, [booking?.mechanicId]);

  // Review section — only for completed bookings.
  useEffect(() => {
    if (!booking || booking.status !== 'COMPLETED') return;
    let cancelled = false;
    setReviewLoading(true);
    setReviewError('');
    getReviewForBooking(booking.id)
      .then((r) => {
        if (!cancelled) setReview(r);
      })
      .catch((err) => {
        if (!cancelled && !isNoReviewError(err)) {
          setReviewError(getApiErrorMessage(err, 'Failed to load review'));
        }
      })
      .finally(() => {
        if (!cancelled) setReviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [booking?.id, booking?.status]);

  /* ----------------------- Poll every 15s while active -------------------- */
  useEffect(() => {
    if (!bookingId || terminal) return;
    const interval = setInterval(async () => {
      try {
        const fresh = await getBooking(bookingId);
        setBooking(fresh);
      } catch {
        /* transient poll failures are ignored */
      }
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [bookingId, terminal]);

  /* ------------------------------ Actions ------------------------------- */
  const handleCancel = async () => {
    if (!booking) return;
    setCancelling(true);
    setError('');
    try {
      setBooking(await updateBookingStatus(booking.id, 'CANCELLED'));
      setCancelOpen(false);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to cancel booking'));
    } finally {
      setCancelling(false);
    }
  };

  const handleDecision = async (recId: number, status: RecommendationStatus) => {
    setDecisionBusy(recId);
    setError('');
    try {
      const updated = await decideRecommendation(recId, status);
      setRecommendations((recs) => recs.map((r) => (r.id === recId ? updated : r)));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update recommendation'));
    } finally {
      setDecisionBusy(null);
    }
  };

  /* -------------------------------- Render ------------------------------ */
  if (loading) {
    return (
      <div className="container-page py-10">
        <Spinner label="Loading booking…" className="py-24" />
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="container-page py-16">
        <div role="alert" className="rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
        <Link to="/bookings" className="mt-4 inline-block text-sm text-brand-600 dark:text-brand-400 hover:text-brand-600 dark:hover:text-brand-300">
          ← Back to bookings
        </Link>
      </div>
    );
  }

  if (!booking) return null;

  const currentIndex = STATUS_STEPS.indexOf(booking.status as BookingStatus);
  const isCancelled = booking.status === 'CANCELLED';
  const hasSuccessfulPayment = payments.some((p) => p.status === 'SUCCESS');

  return (
    <div className="container-page py-10">
      <Link to="/bookings" className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-600 dark:hover:text-brand-300">
        ← Back to bookings
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {booking.serviceType}
            <span className="text-lg font-normal text-slate-500">#{booking.id}</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Scheduled {formatDateTime(booking.scheduledAt)} · Created {formatDateTime(booking.createdAt)}
          </p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      {error && (
        <div role="alert" className="mt-4 rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Status stepper */}
      {isCancelled ? (
        <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-900/50 p-5 text-sm text-slate-500 dark:text-slate-400">
          This booking was <span className="font-semibold text-slate-700 dark:text-slate-300">cancelled</span> and is no
          longer active.
        </div>
      ) : (
        <ol className="mt-6 flex items-center gap-2">
          {STATUS_STEPS.map((status, i) => {
            const done = i < currentIndex;
            const active = i === currentIndex;
            return (
              <li key={status} className="flex flex-1 items-center gap-2">
                <div className="flex flex-col items-center gap-1">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                      done
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                        : active
                          ? 'bg-brand-600 text-white ring-2 ring-brand-400/40'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {done ? '✓' : i + 1}
                  </span>
                  <span
                    className={`text-[10px] uppercase tracking-wide ${
                      active ? 'font-semibold text-slate-800 dark:text-slate-200' : 'text-slate-500'
                    }`}
                  >
                    {status.replace('_', ' ')}
                  </span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <span
                    className={`h-0.5 flex-1 rounded ${done ? 'bg-emerald-500/40' : 'bg-slate-200 dark:bg-slate-700'}`}
                    aria-hidden
                  />
                )}
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* --------------------------- Left column --------------------------- */}
        <div className="space-y-6 lg:col-span-2">
          {/* Booking details */}
          <Card title="Booking details">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Vehicle</dt>
                <dd className="mt-0.5 font-medium text-slate-800 dark:text-slate-200">
                  {vehicle
                    ? `${vehicle.make} ${vehicle.model} (${vehicle.year})`
                    : `Vehicle #${booking.vehicleId}`}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Registration</dt>
                <dd className="mt-0.5 font-medium text-slate-800 dark:text-slate-200">
                  {vehicle?.registrationNumber ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Address</dt>
                <dd className="mt-0.5 font-medium text-slate-800 dark:text-slate-200">{booking.address}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Estimated cost</dt>
                <dd className="mt-0.5 font-bold text-emerald-600 dark:text-accent-400">
                  {formatCurrency(booking.estimatedCost)}
                </dd>
              </div>
            </dl>
          </Card>

          {/* Mechanic */}
          <Card title="Assigned mechanic">
            {mechanic === 'loading' ? (
              <Spinner size="sm" className="py-4" />
            ) : mechanic ? (
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600/20 text-lg font-bold text-brand-600 dark:text-brand-300">
                  {mechanic.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{mechanic.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {mechanic.skills.join(', ')} · 📍 {mechanic.serviceArea}
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <Stars value={mechanic.averageRating ?? 0} size="sm" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {formatRating(mechanic.averageRating)}
                    </span>
                    · {mechanic.totalJobsCompleted} jobs
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No mechanic assigned yet{booking.status === 'PENDING' ? ' — one will be assigned shortly.' : '.'}
              </p>
            )}
          </Card>

          {/* Spare part recommendations */}
          <Card
            title="Spare Part Recommendations"
            subtitle="Recommended by your mechanic while the job is in progress"
          >
            {recommendations.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 px-4 py-8 text-center text-sm text-slate-500">
                No spare part recommendations yet.
              </p>
            ) : (
              <div className="space-y-3">
                {recommendations.map((rec) => (
                  <RecommendationCard
                    key={rec.id}
                    recommendation={rec}
                    busy={decisionBusy === rec.id}
                    onDecision={(status) => handleDecision(rec.id, status)}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* -------------------------- Right column --------------------------- */}
        <div className="space-y-6">
          {/* Payment */}
          <Card title="Payment">
            {booking.estimatedCost == null ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                The estimated cost hasn't been set yet. Check back after your mechanic reviews the job.
              </p>
            ) : hasSuccessfulPayment ? (
              <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                <span aria-hidden>✅</span> Payment completed for {formatCurrency(booking.estimatedCost)}
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Estimated cost:{' '}
                  <span className="font-bold text-emerald-600 dark:text-accent-400">{formatCurrency(booking.estimatedCost)}</span>
                </p>
                <Link to={`/payments/${booking.id}/checkout`} className="mt-4 block">
                  <Button className="w-full">Pay Now</Button>
                </Link>
              </>
            )}
          </Card>

          {/* Review */}
          {booking.status === 'COMPLETED' && (
            <Card title="Your review">
              {reviewLoading ? (
                <Spinner size="sm" className="py-4" />
              ) : review ? (
                <ReviewView review={review} />
              ) : (
                <>
                  {reviewError && (
                    <p className="mb-3 rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                      {reviewError}
                    </p>
                  )}
                  <ReviewForm
                    bookingId={booking.id}
                    onSubmitted={(r) => setReview(r)}
                    submitLabel="Submit Review"
                  />
                </>
              )}
            </Card>
          )}

          {/* Cancel */}
          {(booking.status === 'PENDING' || booking.status === 'ACCEPTED') && (
            <Card>
              <Button
                variant="danger"
                className="w-full"
                onClick={() => setCancelOpen(true)}
              >
                Cancel Booking
              </Button>
              <p className="mt-2 text-xs text-slate-500">
                Cancellation is allowed while the booking is pending or accepted.
              </p>
            </Card>
          )}
        </div>
      </div>

      <Modal
        open={cancelOpen}
        title="Cancel this booking?"
        onClose={() => setCancelOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelOpen(false)}>
              Keep booking
            </Button>
            <Button variant="danger" onClick={handleCancel} loading={cancelling}>
              {cancelling ? 'Cancelling…' : 'Yes, cancel booking'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-700 dark:text-slate-300">
          This will cancel booking{' '}
          <span className="font-semibold text-slate-900 dark:text-slate-100">#{booking.id}</span> ({booking.serviceType}).
          This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
