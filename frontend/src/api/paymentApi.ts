import { api } from './client';
import type { Payment, PaymentRequest } from '@/types';

/** POST /api/payments — initiate a payment. */
export async function createPayment(payload: PaymentRequest): Promise<Payment> {
  const { data } = await api.post<Payment>('/api/payments', payload);
  return data;
}

/** POST /api/payments/webhook — mock gateway callback (public). */
export async function sendWebhook(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { data } = await api.post<Record<string, unknown>>('/api/payments/webhook', payload);
  return data;
}

/** GET /api/payments/{id} */
export async function getPayment(id: number): Promise<Payment> {
  const { data } = await api.get<Payment>(`/api/payments/${id}`);
  return data;
}

/** GET /api/payments — current user's transactions. */
export async function getMyPayments(): Promise<Payment[]> {
  const { data } = await api.get<Payment[]>('/api/payments');
  return data;
}

/** GET /api/payments/admin/all — all transactions (ADMIN role). */
export async function getAllPayments(): Promise<Payment[]> {
  const { data } = await api.get<Payment[]>('/api/payments/admin/all');
  return data;
}
