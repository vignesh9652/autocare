/** POST /api/reviews body (ReviewRequest on the backend). */
export interface ReviewRequest {
  bookingId: number;
  rating: number; // 1..5
  comment?: string;
}

/** Review DTO (ReviewResponse on the backend). */
export interface Review {
  id: number;
  bookingId: number;
  mechanicId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
}
