import type { AvailabilityStatus } from './common';

/** POST /api/mechanics body (MechanicRequest on the backend). */
export interface MechanicRequest {
  name: string;
  phone: string;
  email: string;
  skills: string[];
  serviceArea: string;
}

/** PUT /api/mechanics/{id} body — all fields optional (UpdateMechanicRequest). */
export interface MechanicUpdateRequest {
  name?: string;
  phone?: string;
  email?: string;
  skills?: string[];
  serviceArea?: string;
}

/** PUT /api/mechanics/{id}/availability body. */
export interface AvailabilityUpdateRequest {
  availabilityStatus: AvailabilityStatus;
}

/** PUT /api/mechanics/{id}/rating body. */
export interface RatingUpdateRequest {
  newRating: number;
}

/** Mechanic DTO (MechanicResponse on the backend). */
export interface Mechanic {
  id: number;
  name: string;
  phone: string;
  email: string;
  skills: string[];
  serviceArea: string;
  availabilityStatus: AvailabilityStatus;
  averageRating: number | null;
  totalJobsCompleted: number;
}
