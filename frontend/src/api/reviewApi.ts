import { api } from './client';
import type { Review, ReviewRequest } from '@/types';

/** POST /api/reviews */
export async function createReview(payload: ReviewRequest): Promise<Review> {
  const { data } = await api.post<Review>('/api/reviews', payload);
  return data;
}

/** GET /api/reviews/mechanic/{mechanicId} */
export async function getReviewsForMechanic(mechanicId: number): Promise<Review[]> {
  const { data } = await api.get<Review[]>(`/api/reviews/mechanic/${mechanicId}`);
  return data;
}

/**
 * GET /api/reviews/booking/{bookingId}
 * The backend returns 404 when the booking has no review yet — the caller
 * should treat that as "no review" (see isNoReviewError).
 */
export async function getReviewForBooking(bookingId: number): Promise<Review> {
  const { data } = await api.get<Review>(`/api/reviews/booking/${bookingId}`);
  return data;
}

/** True when the error is a 404 "review not found" (i.e. no review exists yet). */
export function isNoReviewError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    (error as { response?: { status?: number } }).response?.status === 404
  );
}
