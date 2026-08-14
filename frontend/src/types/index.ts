// ─── Enums ──────────────────────────────────────────────────────────────────
export type Role = 'CUSTOMER' | 'MECHANIC' | 'ADMIN';
export type AccountStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type VehicleType = 'CAR' | 'SEDAN' | 'SUV' | 'HATCHBACK' | 'TRUCK' | 'VAN' | 'BIKE' | 'MOTORCYCLE';
export type AvailabilityStatus = 'AVAILABLE' | 'BUSY' | 'OFFLINE';
export type BookingStatus = 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'PAYMENT_PENDING' | 'PAID' | 'REJECTED' | 'CANCELLED';
export type AdditionalServiceStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type PaymentStatus = 'INITIATED' | 'SUCCESS' | 'FAILED';
export type PaymentMethod = 'UPI' | 'CARD' | 'NETBANKING' | 'CASH';
export type EarningStatus = 'PENDING' | 'PAID';
export type ReferenceType = 'BOOKING' | 'SPARE_PART';
export type RecommendationStatus = 'RECOMMENDED' | 'APPROVED' | 'REJECTED' | 'ORDERED';

// ─── Auth ───────────────────────────────────────────────────────────────────
export interface AuthResponse {
  token: string;
  userId: number;
  name: string;
  role: Role;
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  status: AccountStatus;
  createdAt: string;
}

// ─── Vehicle ────────────────────────────────────────────────────────────────
export interface VehicleRequest {
  make: string;
  model: string;
  year: number;
  registrationNumber: string;
  vehicleType: VehicleType;
}

export interface VehicleResponse extends VehicleRequest {
  id: number;
  userId: number;
  imageUrl?: string | null;
  createdAt: string;
}

// ─── Mechanic ───────────────────────────────────────────────────────────────
export interface MechanicResponse {
  id: number;
  userId?: number | null;
  name: string;
  phone: string;
  email: string;
  skills: string[];
  serviceArea: string;
  latitude?: number;
  longitude?: number;
  availabilityStatus: AvailabilityStatus;
  averageRating: number | null;
  totalJobsCompleted: number;
}

// ─── Service catalogue (platform-controlled pricing) ───────────────────────
export interface ServiceResponse {
  id: number;
  serviceName: string;
  description?: string | null;
  basePrice: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionConfigResponse {
  platformCommissionPercentage: number;
}

// ─── Mechanic earnings ─────────────────────────────────────────────────────
export interface MechanicEarningResponse {
  id: number;
  bookingId: number;
  paymentId: number;
  serviceAmount: number;
  platformCommission: number;
  mechanicEarning: number;
  earningStatus: EarningStatus;
  createdAt: string;
}

export interface EarningsSummaryResponse {
  totalEarnings: number;
  pendingEarnings: number;
  completedEarnings: number;
  availableBalance: number;
  earnings: MechanicEarningResponse[];
}

// ─── Booking ────────────────────────────────────────────────────────────────
export interface BookingRequest {
  vehicleId: number;
  /** May be several services joined with " + ", e.g. "General Service + Brake Repair". */
  serviceType: string;
  scheduledAt: string;
  address: string;
  /** Exact GPS-fixed service location, captured from the customer's device. */
  latitude?: number;
  longitude?: number;
  /** Estimated amount for the selected services — backend recomputes from the platform catalogue. */
  estimatedAmount?: number;
  /** Chosen mechanic — when set, the request goes directly to them. */
  mechanicId?: number;
  preferredSkill?: string;
  serviceArea?: string;
}

export interface BookingResponse {
  id: number;
  userId: number;
  vehicleId: number;
  mechanicId: number | null;
  serviceType: string;
  status: BookingStatus;
  scheduledAt: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  /** Platform estimate shown before booking. */
  estimatedAmount: number | null;
  /** Sum of APPROVED additional services (0 when none). */
  additionalAmount: number | null;
  /** Final amount after inspection (set when the service completes). */
  finalAmount: number | null;
  /** AutoCare commission (set after payment). */
  platformCommission: number | null;
  /** Mechanic's share (set after payment). */
  mechanicEarning: number | null;
  createdAt: string;
}

// ─── Spare parts ────────────────────────────────────────────────────────────
export interface SparePartResponse {
  id: number;
  name: string;
  description?: string;
  compatibleVehicleModels?: string[];
  price: number;
  stockQuantity: number;
  category: string;
  imageUrl?: string | null;
  tutorialVideoUrl?: string;
  installationSteps?: string;
  createdAt: string;
}

export interface RecommendationResponse {
  id: number;
  bookingId: number;
  mechanicId: number;
  sparePart: SparePartResponse;
  quantity: number;
  reason?: string;
  status: RecommendationStatus;
  createdAt: string;
  decidedAt?: string;
}

// ─── Additional services (vehicle inspection) ───────────────────────────────
export interface AdditionalServiceResponse {
  id: number;
  bookingId: number;
  mechanicId: number;
  customerId: number;
  serviceId: number;
  serviceName: string;
  reason?: string | null;
  amount: number;
  status: AdditionalServiceStatus;
  customerResponseAt?: string | null;
  createdAt: string;
}

export interface AdditionalServiceCreateRequest {
  bookingId: number;
  serviceId: number;
  reason: string;
}

// ─── Payments ───────────────────────────────────────────────────────────────
export interface PaymentResponse {
  id: number;
  referenceType: ReferenceType;
  referenceId: number;
  amount: number;
  currency: string;
  status: PaymentStatus;
  gatewayTransactionId: string;
  paymentMethod: string;
  paidAt?: string | null;
  createdAt: string;
}

/** Razorpay order payload returned by POST /api/payments/create-order. */
export interface CreateOrderResponse {
  paymentId: number;
  bookingId: number;
  /** Razorpay order id (order_…) used to open the Checkout SDK. */
  razorpayOrderId: string;
  /** Public Razorpay key id — safe to expose to the browser. */
  razorpayKeyId: string;
  /** Amount in paise (₹999.00 → 99900) as required by the Checkout SDK. */
  amount: number;
  currency: string;
  status: string;
}

export interface VerifyPaymentRequest {
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  cancelled?: boolean;
  paymentId: number | null;
  bookingId: number;
  /** Razorpay payment id (pay_…) when captured, else the order id. */
  transactionId: string | null;
  /** Raw Razorpay payment id (pay_…) — null until the payment is captured. */
  razorpayPaymentId: string | null;
  paymentMethod: string | null;
  amount: number | null;
  status: string;
}

// ─── Reviews ────────────────────────────────────────────────────────────────
export interface ReviewResponse {
  id: number;
  bookingId: number;
  mechanicId: number | null;
  rating: number;
  comment?: string;
  createdAt: string;
}

// ─── Notifications ──────────────────────────────────────────────────────────
export interface NotificationItem {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// ─── Admin ──────────────────────────────────────────────────────────────────
export interface DashboardResponse {
  totalUsers: number;
  totalCustomers: number;
  totalMechanics: number;
  pendingMechanicApprovals: number;
  totalBookings: number;
  bookingsByStatus: Record<string, number>;
  totalRevenue: number;
  /** Sum of finalAmount across PAID bookings. */
  totalServiceRevenue: number;
  /** Sum of AutoCare commission across PAID bookings. */
  platformCommission: number;
  /** Sum of mechanicEarning across PAID bookings. */
  mechanicEarnings: number;
  successfulPayments: number;
  pendingPayments: number;
  failedPayments: number;
  lowStockPartsCount: number;
  unavailableServices: string[];
}
