/** GET /api/admin/dashboard (DashboardResponse on the backend). */
export interface AdminDashboard {
  totalUsers: number;
  totalCustomers: number;
  totalMechanics: number;
  /** Mechanic accounts awaiting admin approval. */
  pendingMechanicApprovals: number;
  totalBookings: number;
  bookingsByStatus: Record<string, number>;
  totalRevenue: number;
  lowStockPartsCount: number;
  unavailableServices: string[];
}

/** Admin endpoints that proxy other services return List<Map<String, Object>>. */
export type AdminRow = Record<string, unknown>;
