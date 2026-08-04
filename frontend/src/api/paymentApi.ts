import { api } from './client';
import type { Payment, PaymentRequest } from '@/types';

/** POST /api/payments — initiate a payment. */
export async function createPayment(payload: PaymentRequest): Promise<Payment> {
  const { data } = await api.post<Payment>('/api/payments', payload);
  return data;
}

/** GET /api/payments/{id} */
export async function getPayment(id: number): Promise<Payment> {
  const { data } = await api.get<Payment>(`/api/payments/${id}`);
  return data;
}

/** GET /api/payments — current user's transactions. */
export async function getPayments(): Promise<Payment[]> {
  const { data } = await api.get<Payment[]>('/api/payments');
  return data;
}

/** GET /api/payments/admin/all — all transactions (ADMIN role). */
export async function getAllPayments(): Promise<Payment[]> {
  const { data } = await api.get<Payment[]>('/api/payments/admin/all');
  return data;
}

/* ----------------------------------------------------------------------- */
/* DEV-ONLY — simulate a gateway webhook callback                          */
/* ----------------------------------------------------------------------- */
// The mock gateway (MockGatewayService) signs every webhook with an
// HMAC-SHA256 of `${gatewayTransactionId}.${status}` using the shared dev
// secret `app.webhook.secret` (default "autocare-webhook-secret"). This
// helper recomputes that signature in the browser and posts it to the
// public /api/payments/webhook endpoint so the checkout flow can be tested
// end-to-end without a real payment gateway.
//
// ⚠️ DEV ONLY: the shared secret is baked into the frontend build. In a real
// deployment this button/helper must be removed — the webhook would only ever
// be called by the actual payment gateway server-side.
const DEV_WEBHOOK_SECRET = 'autocare-webhook-secret';

async function hmacSha256Base64(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  // Convert the ArrayBuffer to a Base64 string (browser-safe, no atob of raw bytes).
  const bytes = new Uint8Array(signature);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/**
 * DEV-ONLY: simulate a gateway webhook for the given transaction.
 * Marks the payment SUCCESS (or FAILED) exactly like the mock gateway would.
 */
export async function simulateWebhook(
  gatewayTransactionId: string,
  status: 'SUCCESS' | 'FAILED',
): Promise<Record<string, unknown>> {
  if (!crypto?.subtle) {
    throw new Error('Web Crypto (crypto.subtle) is unavailable — required to sign the webhook. Use http://localhost.');
  }
  const signature = await hmacSha256Base64(`${gatewayTransactionId}.${status}`, DEV_WEBHOOK_SECRET);
  const { data } = await api.post<Record<string, unknown>>('/api/payments/webhook', {
    gatewayTransactionId,
    status,
    signature,
  });
  return data;
}
