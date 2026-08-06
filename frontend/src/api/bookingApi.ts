import { api } from './client';
import type { Booking, BookingRequest, BookingStatus, BookingStatusUpdateRequest } from '@/types';

/** POST /api/bookings */
export async function createBooking(payload: BookingRequest): Promise<Booking> {
  const { data } = await api.post<Booking>('/api/bookings', payload);
  return data;
}

/** GET /api/bookings — current user's bookings. */
export async function getBookings(): Promise<Booking[]> {
  const { data } = await api.get<Booking[]>('/api/bookings');
  return data;
}

/** GET /api/bookings/mechanic/assigned — bookings assigned to the logged-in mechanic. */
export async function getMechanicBookings(): Promise<Booking[]> {
  const { data } = await api.get<Booking[]>('/api/bookings/mechanic/assigned');
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

/** PUT /api/bookings/{id}/status — body is just { status }. */
export async function updateBookingStatus(
  id: number,
  status: BookingStatus,
): Promise<Booking> {
  const payload: BookingStatusUpdateRequest = { status };
  const { data } = await api.put<Booking>(`/api/bookings/${id}/status`, payload);
  return data;
}
