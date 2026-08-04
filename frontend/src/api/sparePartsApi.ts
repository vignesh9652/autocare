import { api } from './client';
import type {
  Recommendation,
  RecommendationDecisionRequest,
  RecommendationRequest,
  RecommendationStatus,
  SparePart,
  SparePartRequest,
} from '@/types';

/* ----------------------------- Spare parts ----------------------------- */

export interface PartFilters {
  category?: string;
  search?: string;
}

/** GET /api/parts?category=&search= */
export async function getParts(filters: PartFilters = {}): Promise<SparePart[]> {
  const { data } = await api.get<SparePart[]>('/api/parts', { params: filters });
  return data;
}

/** GET /api/parts/{id} */
export async function getPart(id: number): Promise<SparePart> {
  const { data } = await api.get<SparePart>(`/api/parts/${id}`);
  return data;
}

/** POST /api/parts (authenticated: admin or mechanic). */
export async function createPart(payload: SparePartRequest): Promise<SparePart> {
  const { data } = await api.post<SparePart>('/api/parts', payload);
  return data;
}

/* -------------------------- Recommendations ---------------------------- */

/** POST /api/recommendations (mechanic role). */
export async function createRecommendation(
  payload: RecommendationRequest,
): Promise<Recommendation> {
  const { data } = await api.post<Recommendation>('/api/recommendations', payload);
  return data;
}

/** GET /api/recommendations/booking/{bookingId} — recommendations for one booking. */
export async function getRecommendationsForBooking(bookingId: number): Promise<Recommendation[]> {
  const { data } = await api.get<Recommendation[]>(`/api/recommendations/booking/${bookingId}`);
  return data;
}

/** PUT /api/recommendations/{id}/decision — body is just { status }. */
export async function decideRecommendation(
  id: number,
  status: RecommendationStatus,
): Promise<Recommendation> {
  const payload: RecommendationDecisionRequest = { status };
  const { data } = await api.put<Recommendation>(`/api/recommendations/${id}/decision`, payload);
  return data;
}
