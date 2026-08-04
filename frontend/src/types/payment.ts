import type { PaymentStatus, ReferenceType } from './common';

/** POST /api/payments body (PaymentRequest on the backend). */
export interface PaymentRequest {
  referenceType: ReferenceType;
  referenceId: number;
  amount: number;
  paymentMethod: string; // e.g. CARD, UPI, NETBANKING
}

/** Payment/transaction DTO (PaymentResponse on the backend). */
export interface Payment {
  id: number;
  referenceType: ReferenceType;
  referenceId: number;
  amount: number;
  currency: string;
  status: PaymentStatus;
  gatewayTransactionId: string;
  createdAt: string;
}
