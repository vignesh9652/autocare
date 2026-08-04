import { api } from './client';
import type { Vehicle, VehicleRequest } from '@/types';

/** GET /api/vehicles — current user's vehicles. */
export async function getVehicles(): Promise<Vehicle[]> {
  const { data } = await api.get<Vehicle[]>('/api/vehicles');
  return data;
}

/** GET /api/vehicles/{id} */
export async function getVehicle(id: number): Promise<Vehicle> {
  const { data } = await api.get<Vehicle>(`/api/vehicles/${id}`);
  return data;
}

/** POST /api/vehicles */
export async function createVehicle(payload: VehicleRequest): Promise<Vehicle> {
  const { data } = await api.post<Vehicle>('/api/vehicles', payload);
  return data;
}

/** PUT /api/vehicles/{id} */
export async function updateVehicle(id: number, payload: VehicleRequest): Promise<Vehicle> {
  const { data } = await api.put<Vehicle>(`/api/vehicles/${id}`, payload);
  return data;
}

/** DELETE /api/vehicles/{id} */
export async function deleteVehicle(id: number): Promise<void> {
  await api.delete(`/api/vehicles/${id}`);
}
