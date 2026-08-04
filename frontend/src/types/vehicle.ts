import type { VehicleType } from './common';

/** POST/PUT /api/vehicles body (VehicleRequest on the backend). */
export interface VehicleRequest {
  make: string;
  model: string;
  year: number;
  registrationNumber: string;
  vehicleType: VehicleType;
}

/** Vehicle DTO (VehicleResponse on the backend). */
export interface Vehicle {
  id: number;
  userId: number;
  make: string;
  model: string;
  year: number;
  registrationNumber: string;
  vehicleType: VehicleType;
  createdAt: string;
}
