/**
 * Enums shared across AutoCare services.
 * These mirror the Java enums on the backend (kept as string unions so
 * values arrive from the API as plain strings).
 */

export type Role = 'CUSTOMER' | 'MECHANIC' | 'ADMIN';

export type VehicleType =
  | 'CAR'
  | 'SEDAN'
  | 'SUV'
  | 'HATCHBACK'
  | 'TRUCK'
  | 'VAN'
  | 'BIKE'
  | 'MOTORCYCLE';

export type AvailabilityStatus = 'AVAILABLE' | 'BUSY' | 'OFFLINE';

export type BookingStatus = 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type PaymentStatus = 'INITIATED' | 'SUCCESS' | 'FAILED';

export type ReferenceType = 'BOOKING' | 'SPARE_PART';

export type RecommendationStatus = 'RECOMMENDED' | 'APPROVED' | 'REJECTED' | 'ORDERED';

export interface ApiError {
  error?: string;
  message?: string;
  timestamp?: string;
  status?: number;
}
