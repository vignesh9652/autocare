import { api } from './client';
import type { Booking, BookingRequest, BookingStatusUpdateRequest } from '@/types';

/** POST /api/bookings */
export async function createBooking(payload: BookingRequest): Promise<Booking> {
  const { data } = await api.post<Booking>('/api/bookings', payload);
  return data;
}

/** GET /api/bookings — current user's bookings. */
export async function getMyBookings(): Promise<Booking[]> {
  const { data } = await api.get<Booking[]>('/api/bookings');
  return data;
}

/** GET /api/bookings/admin/all — all bookings (ADMIN role). */
export async function getAllBookings(): Promise<Booking[]> {
  const { data } = await api.get<Booking[]>('/api/bookings/admin/all');
  return data;
}

/** GET /api/bookings/{id} */
export async function getBooking(id: number): Promise<Booking> {
  const { data } = await api.get<Booking>(`/api/bookings/${id}`);
  return data;
}

/** PUT /api/bookings/{id}/status */
export async function updateBookingStatus(
  id: number,
  payload: BookingStatusUpdateRequest,
): Promise<Booking> {
  const { data } = await api.put<Booking>(`/api/bookings/${id}/status`, payload);
  return data;
}
