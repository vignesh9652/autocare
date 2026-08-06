import { api } from './client';
import type { AdminDashboard, AdminRow, User } from '@/types';

/** GET /api/admin/dashboard — aggregated platform metrics (ADMIN role). */
export async function getDashboard(): Promise<AdminDashboard> {
  const { data } = await api.get<AdminDashboard>('/api/admin/dashboard');
  return data;
}

/** GET /api/admin/bookings — all bookings (ADMIN role). */
export async function getAdminBookings(): Promise<AdminRow[]> {
  const { data } = await api.get<AdminRow[]>('/api/admin/bookings');
  return data;
}

/** GET /api/admin/mechanics — all mechanics with ratings. */
export async function getAdminMechanics(): Promise<AdminRow[]> {
  const { data } = await api.get<AdminRow[]>('/api/admin/mechanics');
  return data;
}

/** GET /api/admin/payments — all transactions (ADMIN role). */
export async function getAdminPayments(): Promise<AdminRow[]> {
  const { data } = await api.get<AdminRow[]>('/api/admin/payments');
  return data;
}

/** GET /api/admin/mechanics/{mechanicId}/reviews — reviews for one mechanic. */
export async function getAdminMechanicReviews(mechanicId: number): Promise<AdminRow[]> {
  const { data } = await api.get<AdminRow[]>(`/api/admin/mechanics/${mechanicId}/reviews`);
  return data;
}

/** GET /api/admin/vehicles/{vehicleId} — a single vehicle by id. */
export async function getAdminVehicle(vehicleId: number): Promise<AdminRow> {
  const { data } = await api.get<AdminRow>(`/api/admin/vehicles/${vehicleId}`);
  return data;
}

/** GET /api/users/admin/all — all users (ADMIN role). */
export async function getAdminUsers(): Promise<User[]> {
  const { data } = await api.get<User[]>('/api/users/admin/all');
  return data;
}

/** GET /api/admin/mechanics/pending — mechanic accounts awaiting approval. */
export async function getPendingMechanics(): Promise<User[]> {
  const { data } = await api.get<User[]>('/api/admin/mechanics/pending');
  return data;
}

/** PUT /api/admin/mechanics/{id}/approve — approve a mechanic registration. */
export async function approveMechanic(id: number): Promise<{ message: string }> {
  const { data } = await api.put<{ message: string }>(`/api/admin/mechanics/${id}/approve`);
  return data;
}

/** PUT /api/admin/mechanics/{id}/reject — reject a mechanic registration. */
export async function rejectMechanic(id: number): Promise<{ message: string }> {
  const { data } = await api.put<{ message: string }>(`/api/admin/mechanics/${id}/reject`);
  return data;
}
