import type { BookingStatus } from './common';

/** POST /api/bookings body (BookingRequest on the backend). */
export interface BookingRequest {
  vehicleId: number;
  serviceType: string;
  scheduledAt: string; // ISO 8601 LocalDateTime, e.g. "2026-08-10T10:30:00"
  address: string;
  preferredSkill?: string;
  serviceArea?: string;
}

/** PUT /api/bookings/{id}/status body. */
export interface BookingStatusUpdateRequest {
  status: BookingStatus;
}

/** Booking DTO (BookingResponse on the backend). */
export interface Booking {
  id: number;
  userId: number;
  vehicleId: number;
  mechanicId: number | null;
  serviceType: string;
  status: BookingStatus;
  scheduledAt: string;
  address: string;
  estimatedCost: number | null;
  createdAt: string;
}
