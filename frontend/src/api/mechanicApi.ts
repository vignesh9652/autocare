import { api } from './client';
import type {
  AvailabilityUpdateRequest,
  Mechanic,
  MechanicRequest,
  MechanicUpdateRequest,
  RatingUpdateRequest,
} from '@/types';

export interface MechanicFilters {
  available?: boolean;
  skill?: string;
  area?: string;
}

/** GET /api/mechanics?available=&skill=&area= */
export async function getMechanics(filters: MechanicFilters = {}): Promise<Mechanic[]> {
  const { data } = await api.get<Mechanic[]>('/api/mechanics', { params: filters });
  return data;
}

/** GET /api/mechanics/{id} */
export async function getMechanic(id: number): Promise<Mechanic> {
  const { data } = await api.get<Mechanic>(`/api/mechanics/${id}`);
  return data;
}

/** POST /api/mechanics */
export async function createMechanic(payload: MechanicRequest): Promise<Mechanic> {
  const { data } = await api.post<Mechanic>('/api/mechanics', payload);
  return data;
}

/** PUT /api/mechanics/{id} */
export async function updateMechanic(id: number, payload: MechanicUpdateRequest): Promise<Mechanic> {
  const { data } = await api.put<Mechanic>(`/api/mechanics/${id}`, payload);
  return data;
}

/** PUT /api/mechanics/{id}/availability */
export async function updateAvailability(
  id: number,
  payload: AvailabilityUpdateRequest,
): Promise<Mechanic> {
  const { data } = await api.put<Mechanic>(`/api/mechanics/${id}/availability`, payload);
  return data;
}

/** PUT /api/mechanics/{id}/rating */
export async function updateRating(id: number, payload: RatingUpdateRequest): Promise<Mechanic> {
  const { data } = await api.put<Mechanic>(`/api/mechanics/${id}/rating`, payload);
  return data;
}
