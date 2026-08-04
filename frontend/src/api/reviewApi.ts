import { api } from './client';
import type { Review, ReviewRequest } from '@/types';

/** POST /api/reviews */
export async function createReview(payload: ReviewRequest): Promise<Review> {
  const { data } = await api.post<Review>('/api/reviews', payload);
  return data;
}

/** GET /api/reviews/mechanic/{mechanicId} */
export async function getReviewsByMechanic(mechanicId: number): Promise<Review[]> {
  const { data } = await api.get<Review[]>(`/api/reviews/mechanic/${mechanicId}`);
  return data;
}

/** GET /api/reviews/booking/{bookingId} */
export async function getReviewByBooking(bookingId: number): Promise<Review> {
  const { data } = await api.get<Review>(`/api/reviews/booking/${bookingId}`);
  return data;
}
