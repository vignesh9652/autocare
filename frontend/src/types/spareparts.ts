import type { RecommendationStatus } from './common';

/** POST /api/parts body (SparePartRequest on the backend). */
export interface SparePartRequest {
  name: string;
  description?: string;
  compatibleVehicleModels?: string[];
  price: number;
  stockQuantity: number;
  category: string;
  tutorialVideoUrl?: string;
  installationSteps?: string;
}

/** Spare part DTO (SparePartResponse on the backend). */
export interface SparePart {
  id: number;
  name: string;
  description: string | null;
  compatibleVehicleModels: string[];
  price: number;
  stockQuantity: number;
  category: string;
  tutorialVideoUrl: string | null;
  installationSteps: string | null;
  createdAt: string;
}

/** POST /api/recommendations body (RecommendationRequest on the backend). */
export interface RecommendationRequest {
  bookingId: number;
  sparePartId: number;
  quantity: number;
  reason: string;
}

/** PUT /api/recommendations/{id}/decision body. */
export interface RecommendationDecisionRequest {
  status: RecommendationStatus;
}

/** Recommendation DTO (RecommendationResponse on the backend). */
export interface Recommendation {
  id: number;
  bookingId: number;
  mechanicId: number;
  sparePart: SparePart;
  quantity: number;
  reason: string;
  status: RecommendationStatus;
  createdAt: string;
  decidedAt: string | null;
}
