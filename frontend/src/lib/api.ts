import axios, { AxiosError } from 'axios';
import { queryClient } from './query-client';
import { useAuthStore } from '@/stores/auth-store';
import {
  AuthResponse,
  AdditionalServiceCreateRequest,
  AdditionalServiceResponse,
  AdminWalletResponse,
  BookingRequest,
  BookingResponse,
  BookingStatus,
  CommissionConfigResponse,
  CreateOrderResponse,
  CreateSparePartOrderResponse,
  DashboardResponse,
  DiyGuide,
  DiyStep,
  EarningsSummaryResponse,
  MechanicResponse,
  MechanicWalletResponse,
  NotificationItem,
  PaymentMethod,
  PaymentResponse,
  RecommendationResponse,
  ReviewResponse,
  Role,
  ServiceResponse,
  SparePartOrder,
  SparePartOrderStatus,
  SparePartResponse,
  UserResponse,
  VehicleRequest,
  VehicleResponse,
  VehicleType,
  VerifyPaymentRequest,
  VerifyPaymentResponse,
  WalletTransactionResponse,
  WithdrawalRequestResponse,
  WithdrawalStatus,
} from '@/types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '';

export const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<{ error?: string; message?: string }>) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      useAuthStore.getState().logout();
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string; message?: string } | undefined;
    if (data?.error) return data.error;
    if (data?.message) return data.message;
    if (error.response?.status === 401) return 'Invalid email or password';
    if (error.response?.status === 403) return 'You do not have permission to perform this action';
    if (error.response?.status === 409) return 'This resource already exists';
    return error.message || 'Something went wrong';
  }
  return 'Something went wrong';
}

// ─── Auth ───────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/api/auth/login', { email, password }).then((r) => r.data),
  register: (data: { name: string; email: string; password: string; phone?: string; role?: Role }) =>
    api.post<AuthResponse>('/api/auth/register', data).then((r) => r.data),
  forgotPassword: (email: string) =>
    api.post<{ message: string; otp: string }>('/api/auth/forgot-password', { email }).then((r) => r.data),
  verifyOtp: (email: string, otp: string) =>
    api.post<{ valid: boolean }>('/api/auth/verify-otp', { email, otp }).then((r) => r.data),
  resetPassword: (email: string, otp: string, newPassword: string) =>
    api.post<{ message: string }>('/api/auth/reset-password', { email, otp, newPassword }).then((r) => r.data),
};

// ─── Vehicles ───────────────────────────────────────────────────────────────
export const vehicleApi = {
  getMyVehicles: () => api.get<VehicleResponse[]>('/api/vehicles').then((r) => r.data),
  createVehicle: (data: VehicleRequest) => api.post<VehicleResponse>('/api/vehicles', data).then((r) => r.data),
  updateVehicle: (id: number, data: VehicleRequest) => api.put<VehicleResponse>(`/api/vehicles/${id}`, data).then((r) => r.data),
  deleteVehicle: (id: number) => api.delete(`/api/vehicles/${id}`),
  uploadImage: (id: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<{ imageUrl: string; vehicle: VehicleResponse }>(`/api/vehicles/${id}/image`, form).then((r) => r.data);
  },
};

// ─── Mechanics ──────────────────────────────────────────────────────────────
export const mechanicApi = {
  getAll: (params?: { available?: boolean; skill?: string; area?: string }) =>
    api.get<MechanicResponse[]>('/api/mechanics', { params }).then((r) => r.data),
  get: (id: number) => api.get<MechanicResponse>(`/api/mechanics/${id}`).then((r) => r.data),
  getByUser: (userId: number) => api.get<MechanicResponse>(`/api/mechanics/by-user/${userId}`).then((r) => r.data),
  create: (data: { name: string; phone: string; email: string; skills: string[]; serviceArea: string; latitude?: number; longitude?: number }) =>
    api.post<MechanicResponse>('/api/mechanics', data).then((r) => r.data),
  updateAvailability: (id: number, availabilityStatus: 'AVAILABLE' | 'BUSY' | 'OFFLINE') =>
    api.put<MechanicResponse>(`/api/mechanics/${id}/availability`, { availabilityStatus }).then((r) => r.data),
  update: (id: number, data: { name?: string; phone?: string; skills?: string[]; serviceArea?: string; latitude?: number; longitude?: number }) =>
    api.put<MechanicResponse>(`/api/mechanics/${id}`, data).then((r) => r.data),
};

// ─── Bookings ───────────────────────────────────────────────────────────────
export const bookingApi = {
  create: (data: BookingRequest) => api.post<BookingResponse>('/api/bookings', data).then((r) => r.data),
  /** Books a mechanic to install a spare part (SPARE_PART_INSTALLATION). */
  createInstallation: (data: InstallationBookingRequest) =>
    api.post<BookingResponse>('/api/bookings/installation', data).then((r) => r.data),
  getMine: () => api.get<BookingResponse[]>('/api/bookings').then((r) => r.data),
  getAll: () => api.get<BookingResponse[]>('/api/bookings/admin/all').then((r) => r.data),
  get: (id: number) => api.get<BookingResponse>(`/api/bookings/${id}`).then((r) => r.data),
  getAssigned: () => api.get<BookingResponse[]>('/api/bookings/mechanic/assigned').then((r) => r.data),
  updateStatus: (id: number, status: BookingStatus) =>
    api.put<BookingResponse>(`/api/bookings/${id}/status`, { status }).then((r) => r.data),
};

export interface InstallationBookingRequest {
  vehicleId: number;
  sparePartId: number;
  /** Optional — links this installation to a purchased spare-part order. */
  sparePartOrderId?: number;
  scheduledAt: string;
  address: string;
  latitude?: number;
  longitude?: number;
  mechanicId?: number;
  preferredSkill?: string;
  serviceArea?: string;
}

// SSE live tracking — fetch-based so we can send the Authorization header
export function subscribeToBookingStream(
  bookingId: number,
  onEvent: (data: Record<string, string>) => void,
  signal?: AbortSignal
): void {
  const token = useAuthStore.getState().token;
  const url = `${API_BASE_URL}/api/bookings/${bookingId}/stream`;
  void (async () => {
    try {
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal,
      });
      if (!res.ok || !res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';
        for (const raw of events) {
          const dataLine = raw.split('\n').find((l) => l.startsWith('data:'));
          if (dataLine) {
            try {
              onEvent(JSON.parse(dataLine.slice(5).trim()));
            } catch {
              /* ignore malformed */
            }
          }
        }
      }
    } catch {
      /* stream ended */
    }
  })();
}

// ─── Spare parts ────────────────────────────────────────────────────────────
export const partsApi = {
  getAll: (params?: { category?: string; search?: string }) =>
    api.get<SparePartResponse[]>('/api/parts', { params }).then((r) => r.data),
  get: (id: number) => api.get<SparePartResponse>(`/api/parts/${id}`).then((r) => r.data),
  uploadImage: (id: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<{ imageUrl: string; part: SparePartResponse }>(`/api/parts/${id}/image`, form).then((r) => r.data);
  },
};

export const recommendationsApi = {
  create: (data: { bookingId: number; sparePartId: number; quantity: number; reason?: string }) =>
    api.post<RecommendationResponse>('/api/recommendations', data).then((r) => r.data),
  getForBooking: (bookingId: number) =>
    api.get<RecommendationResponse[]>(`/api/recommendations/booking/${bookingId}`).then((r) => r.data),
  decide: (id: number, status: 'APPROVED' | 'REJECTED') =>
    api.put<RecommendationResponse>(`/api/recommendations/${id}/decision`, { status }).then((r) => r.data),
};

// ─── Payments ───────────────────────────────────────────────────────────────
export const paymentApi = {
  /** Mock-gateway payment (spare-part checkout). Kept for compatibility. */
  create: (data: { referenceType: 'BOOKING' | 'SPARE_PART'; referenceId: number; amount: number; paymentMethod: PaymentMethod | string }) =>
    api.post<PaymentResponse>('/api/payments', data).then((r) => r.data),
  /** Dev simulation of the gateway's final status callback (SUCCESS | FAILED). */
  process: (id: number, status: 'SUCCESS' | 'FAILED') =>
    api.post<{ status: string; transactionStatus: string }>(`/api/payments/${id}/process`, { status }).then((r) => r.data),
  /** Creates a Razorpay order for a completed booking. Amount is resolved server-side. */
  createOrder: (bookingId: number) =>
    api.post<CreateOrderResponse>('/api/payments/create-order', { bookingId }).then((r) => r.data),
  /** Creates a Razorpay order for a spare-part purchase. Amount is resolved server-side. */
  createSparePartOrder: (orderId: number) =>
    api.post<CreateSparePartOrderResponse>('/api/payments/create-spare-part-order', { orderId }).then((r) => r.data),
  /** Verifies the Razorpay signature on the backend and finalizes the payment. */
  verifyOrder: (data: VerifyPaymentRequest) =>
    api.post<VerifyPaymentResponse>('/api/payments/verify', data).then((r) => r.data),
  getMine: () => api.get<PaymentResponse[]>('/api/payments').then((r) => r.data),
  getAll: () => api.get<PaymentResponse[]>('/api/payments/admin/all').then((r) => r.data),
};

// ─── Additional services / vehicle inspection ──────────────────────────────
export const additionalServiceApi = {
  /** Mechanic raises an additional-service request (price resolved server-side). */
  create: (data: AdditionalServiceCreateRequest) =>
    api.post<AdditionalServiceResponse>('/api/additional-services', data).then((r) => r.data),
  /** Requests for one booking — customer, assigned mechanic or admin. */
  getByBooking: (bookingId: number) =>
    api.get<AdditionalServiceResponse[]>(`/api/additional-services/booking/${bookingId}`).then((r) => r.data),
  /** Admin: every request across all bookings. */
  getAllAdmin: () => api.get<AdditionalServiceResponse[]>('/api/additional-services/admin/all').then((r) => r.data),
  approve: (id: number) => api.post<AdditionalServiceResponse>(`/api/additional-services/${id}/approve`).then((r) => r.data),
  reject: (id: number) => api.post<AdditionalServiceResponse>(`/api/additional-services/${id}/reject`).then((r) => r.data),
};

// ─── Service catalogue (platform-controlled prices) ────────────────────────
export const serviceApi = {
  /** Active services shown to customers when booking. */
  getAll: () => api.get<ServiceResponse[]>('/api/services').then((r) => r.data),
  /** Admin: full catalogue incl. inactive services. */
  getAllAdmin: () => api.get<ServiceResponse[]>('/api/services/admin/all').then((r) => r.data),
  create: (data: { serviceName: string; description?: string; basePrice: number; active?: boolean }) =>
    api.post<ServiceResponse>('/api/services/admin', data).then((r) => r.data),
  update: (id: number, data: { serviceName: string; description?: string; basePrice: number; active?: boolean }) =>
    api.put<ServiceResponse>(`/api/services/admin/${id}`, data).then((r) => r.data),
  getCommissionConfig: () => api.get<CommissionConfigResponse>('/api/services/admin/config').then((r) => r.data),
  updateCommissionConfig: (platformCommissionPercentage: number) =>
    api.put<CommissionConfigResponse>('/api/services/admin/config', { platformCommissionPercentage }).then((r) => r.data),
  /** Admin: spare-part installation fee. */
  getInstallationFee: () => api.get<{ installationFee: number }>('/api/services/admin/installation-fee').then((r) => r.data),
  updateInstallationFee: (installationFee: number) =>
    api.put<{ installationFee: number }>('/api/services/admin/installation-fee', { installationFee }).then((r) => r.data),
};

// ─── DIY guides ─────────────────────────────────────────────────────────────
export const diyApi = {
  /** Published DIY guide for a spare part (404 when none is published). */
  getForPart: (sparePartId: number) => api.get<DiyGuide>(`/api/parts/${sparePartId}/diy`).then((r) => r.data),
  /** Published installation steps. */
  stepsForPart: (sparePartId: number) => api.get<DiyStep[]>(`/api/parts/${sparePartId}/diy/steps`).then((r) => r.data),
  /** Admin: full guide management. */
  listAll: () => api.get<DiyGuide[]>('/api/admin/diy-guides').then((r) => r.data),
  get: (id: number) => api.get<DiyGuide>(`/api/admin/diy-guides/${id}`).then((r) => r.data),
  create: (data: Partial<DiyGuide> & { sparePartId: number; title: string }) =>
    api.post<DiyGuide>('/api/admin/diy-guides', data).then((r) => r.data),
  update: (id: number, data: Partial<DiyGuide>) =>
    api.put<DiyGuide>(`/api/admin/diy-guides/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/api/admin/diy-guides/${id}`),
  publish: (id: number) => api.post<DiyGuide>(`/api/admin/diy-guides/${id}/publish`).then((r) => r.data),
  unpublish: (id: number) => api.post<DiyGuide>(`/api/admin/diy-guides/${id}/unpublish`).then((r) => r.data),
  addStep: (id: number, step: Omit<DiyStep, 'id' | 'diyGuideId'>) =>
    api.post<DiyStep>(`/api/admin/diy-guides/${id}/steps`, step).then((r) => r.data),
  updateStep: (id: number, stepId: number, step: Omit<DiyStep, 'id' | 'diyGuideId'>) =>
    api.put<DiyStep>(`/api/admin/diy-guides/${id}/steps/${stepId}`, step).then((r) => r.data),
  removeStep: (id: number, stepId: number) => api.delete(`/api/admin/diy-guides/${id}/steps/${stepId}`),
  uploadStepImage: (id: number, stepId: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<DiyStep>(`/api/admin/diy-guides/${id}/steps/${stepId}/image`, form).then((r) => r.data);
  },
};

// ─── Spare part orders ─────────────────────────────────────────────────────
export const ordersApi = {
  create: (data: { items: { sparePartId: number; quantity: number }[]; address: string; discountAmount?: number }) =>
    api.post<SparePartOrder>('/api/orders', data).then((r) => r.data),
  getMine: () => api.get<SparePartOrder[]>('/api/orders').then((r) => r.data),
  get: (id: number) => api.get<SparePartOrder>(`/api/orders/${id}`).then((r) => r.data),
  /** Admin: advance the delivery status chain. */
  updateStatus: (id: number, status: SparePartOrderStatus) =>
    api.put<SparePartOrder>(`/api/orders/admin/${id}/status`, { status }).then((r) => r.data),
};

// ─── Mechanic earnings ──────────────────────────────────────────────────────
export const earningsApi = {
  getMine: () => api.get<EarningsSummaryResponse>('/api/mechanics/earnings').then((r) => r.data),
};

// ─── Wallets / money distribution ──────────────────────────────────────────
export const walletApi = {
  /** The authenticated mechanic's own wallet. */
  mechanic: () => api.get<MechanicWalletResponse>('/api/wallet/mechanic').then((r) => r.data),
  /** The authenticated mechanic's ledger. */
  transactions: () => api.get<WalletTransactionResponse[]>('/api/wallet/mechanic/transactions').then((r) => r.data),
  /** Request a withdrawal from the available balance. */
  requestWithdrawal: (amount: number) =>
    api.post<WithdrawalRequestResponse>('/api/wallet/mechanic/withdrawals', { amount }).then((r) => r.data),
  /** The authenticated mechanic's withdrawal requests. */
  myWithdrawals: () => api.get<WithdrawalRequestResponse[]>('/api/wallet/mechanic/withdrawals').then((r) => r.data),
};

// ─── Reviews ────────────────────────────────────────────────────────────────
export const reviewApi = {
  create: (data: { bookingId: number; rating: number; comment?: string }) =>
    api.post<ReviewResponse>('/api/reviews', data).then((r) => r.data),
  getForMechanic: (mechanicId: number) =>
    api.get<ReviewResponse[]>(`/api/reviews/mechanic/${mechanicId}`).then((r) => r.data),
};

// ─── Notifications ──────────────────────────────────────────────────────────
export const notificationApi = {
  getMine: (userId: number) => api.get<NotificationItem[]>('/api/notifications', { params: { userId } }).then((r) => r.data),
  unreadCount: (userId: number) => api.get<{ count: number }>('/api/notifications/unread-count', { params: { userId } }).then((r) => r.data.count),
  markRead: (id: number) => api.put(`/api/notifications/${id}/read`),
  markAllRead: (userId: number) => api.put('/api/notifications/read-all', null, { params: { userId } }),
};

// ─── Admin ──────────────────────────────────────────────────────────────────
export const adminApi = {
  dashboard: () => api.get<DashboardResponse>('/api/admin/dashboard').then((r) => r.data),
  allBookings: () => api.get('/api/admin/bookings').then((r) => r.data as BookingResponse[]),
  allMechanics: () => api.get('/api/admin/mechanics').then((r) => r.data as Array<Record<string, unknown>>),
  pendingMechanics: () => api.get<Array<Record<string, unknown>>>('/api/admin/mechanics/pending').then((r) => r.data),
  approveMechanic: (id: number) => api.put(`/api/admin/mechanics/${id}/approve`).then((r) => r.data),
  rejectMechanic: (id: number) => api.put(`/api/admin/mechanics/${id}/reject`).then((r) => r.data),
  allPayments: () => api.get('/api/admin/payments').then((r) => r.data as PaymentResponse[]),
  allUsers: () => api.get<UserResponse[]>('/api/users/admin/all').then((r) => r.data),
  /** Platform wallet summary (balance / total commission / total withdrawn). */
  wallet: () => api.get<AdminWalletResponse>('/api/admin/wallet').then((r) => r.data),
  /** Platform wallet ledger. */
  walletTransactions: () => api.get<WalletTransactionResponse[]>('/api/admin/wallet/transactions').then((r) => r.data),
  /** Withdrawal requests, optionally filtered by status. */
  walletWithdrawals: (status?: WithdrawalStatus) =>
    api.get<WithdrawalRequestResponse[]>('/api/admin/wallet/withdrawals', { params: status ? { status } : {} }).then((r) => r.data),
  approveWithdrawal: (id: number) => api.post(`/api/admin/wallet/withdrawals/${id}/approve`).then((r) => r.data),
  rejectWithdrawal: (id: number) => api.post(`/api/admin/wallet/withdrawals/${id}/reject`).then((r) => r.data),
};

// Convenience invalidator
export function invalidate(keys: unknown[]): void {
  void queryClient.invalidateQueries({ queryKey: keys });
}

export type { VehicleType };
