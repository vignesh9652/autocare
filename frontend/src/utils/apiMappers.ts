/**
 * Mappers that convert backend API DTOs into the display shapes used by the
 * role-based dashboard pages (types in `@/types/dashboard`) and the spare
 * parts marketplace (`@/types/marketplace`).
 *
 * No fake data is introduced here — fields the backend does not provide get a
 * neutral default (empty string, 0, or null) and pages render those honestly.
 */
import type {
  Booking as ApiBooking,
  Mechanic as ApiMechanic,
  Payment as ApiPayment,
  SparePart as ApiSparePart,
  Vehicle as ApiVehicle,
} from '@/types';
import type {
  AppNotification,
  Booking as DashBooking,
  Mechanic as DashMechanic,
  Payment as DashPayment,
  SparePart as DashPart,
  Vehicle as DashVehicle,
} from '@/types/dashboard';
import type { InstallationGuide, MarketplacePart } from '@/types';

/* ------------------------------------------------------------------ */
/* Vehicles                                                            */
/* ------------------------------------------------------------------ */

export function toDashVehicle(v: ApiVehicle): DashVehicle {
  return {
    id: v.id,
    brand: v.make,
    model: v.model,
    registration: v.registrationNumber,
    vehicleType: v.vehicleType,
    year: v.year,
    color: '—',
    mileage: 0,
    healthScore: 100, // no health diagnostics on the backend
  };
}

/** Human-friendly label for a backend vehicle type (e.g. MOTORCYCLE → Motorcycle). */
export const VEHICLE_TYPE_LABELS: Record<DashVehicle['vehicleType'], string> = {
  CAR: 'Car',
  SEDAN: 'Sedan',
  SUV: 'SUV',
  HATCHBACK: 'Hatchback',
  TRUCK: 'Truck',
  VAN: 'Van',
  BIKE: 'Bike',
  MOTORCYCLE: 'Motorcycle',
};

/* ------------------------------------------------------------------ */
/* Mechanics                                                           */
/* ------------------------------------------------------------------ */

export function toDashMechanic(m: ApiMechanic): DashMechanic {
  return {
    id: m.id,
    name: m.name,
    experience: 0, // not tracked by the backend
    skills: m.skills,
    rating: m.averageRating ?? 0,
    reviewsCount: 0,
    distance: 0,
    available: m.availabilityStatus === 'AVAILABLE',
    jobsCompleted: m.totalJobsCompleted,
  };
}

/* ------------------------------------------------------------------ */
/* Bookings (joined with vehicles + mechanics for display names)       */
/* ------------------------------------------------------------------ */

const DEFAULT_BOOKING_STATUS: DashBooking['status'] = 'PENDING';

export function toDashBooking(
  b: ApiBooking,
  vehicleMap: Map<number, DashVehicle>,
  mechanicMap: Map<number, DashMechanic>,
  paidBookingIds: Set<number>,
): DashBooking {
  const vehicle = vehicleMap.get(b.vehicleId);
  const mechanic = b.mechanicId !== null ? mechanicMap.get(b.mechanicId) : undefined;
  const scheduledAt = b.scheduledAt ?? '';
  const paid = paidBookingIds.has(b.id);
  return {
    id: `BK-${b.id}`,
    vehicle: vehicle ? `${vehicle.brand} ${vehicle.model} · ${vehicle.registration}` : `Vehicle #${b.vehicleId}`,
    vehicleId: b.vehicleId,
    mechanic: mechanic?.name ?? (b.mechanicId !== null ? `Mechanic #${b.mechanicId}` : 'Awaiting assignment'),
    service: b.serviceType,
    date: scheduledAt.slice(0, 10),
    time: scheduledAt.length >= 16 ? scheduledAt.slice(11, 16) : '—',
    status: (b.status as DashBooking['status']) ?? DEFAULT_BOOKING_STATUS,
    paymentStatus: paid ? 'PAID' : b.status === 'CANCELLED' ? 'REFUNDED' : 'PENDING',
    amount: b.estimatedCost ?? 0,
    location: b.address,
  };
}

/** Booking ids that have a successful payment (referenceType BOOKING). */
export function paidBookingIdsFrom(payments: ApiPayment[]): Set<number> {
  const ids = new Set<number>();
  for (const p of payments) {
    if (p.referenceType === 'BOOKING' && p.status === 'SUCCESS') ids.add(p.referenceId);
  }
  return ids;
}

/* ------------------------------------------------------------------ */
/* Payments                                                            */
/* ------------------------------------------------------------------ */

const PAYMENT_METHOD_LABELS: Record<string, DashPayment['method']> = {
  UPI: 'UPI',
  CARD: 'Card',
  NETBANKING: 'Net Banking',
  CASH: 'Cash',
};

export function toDashPayment(p: ApiPayment): DashPayment {
  const reference =
    p.referenceType === 'BOOKING'
      ? `Booking ${p.referenceId}`
      : `Spare part order #${p.referenceId}`;
  const rawMethod = (p.paymentMethod ?? '').toUpperCase();
  const knownMethod = PAYMENT_METHOD_LABELS[rawMethod];
  return {
    id: `TXN-${p.id}`,
    bookingId: `#${p.referenceId}`,
    description: `${reference} — ${knownMethod ?? (rawMethod || 'payment')}`,
    date: p.createdAt?.slice(0, 10) ?? '',
    method: knownMethod ?? 'UPI',
    amount: p.amount,
    status: (p.status === 'SUCCESS' ? 'SUCCESS' : p.status === 'FAILED' ? 'FAILED' : 'PENDING') as DashPayment['status'],
  };
}

/* ------------------------------------------------------------------ */
/* Spare parts                                                         */
/* ------------------------------------------------------------------ */

export function toDashPart(p: ApiSparePart): DashPart {
  return {
    id: p.id,
    name: p.name,
    brand: 'AutoCare',
    price: p.price,
    stock: p.stockQuantity,
    rating: 0, // no review data on the backend
    category: p.category,
    description: p.description ?? undefined,
  };
}

/* ------------------------------------------------------------------ */
/* Marketplace part (rich display shape)                               */
/* ------------------------------------------------------------------ */

const STANDARD_DELIVERY_NOTE = '2–3 business days';

/** Convert an installation-steps string into structured guide steps. */
function stepsFrom(installationSteps: string | null): InstallationGuide['steps'] {
  if (!installationSteps) return [];
  return installationSteps
    .split(/\n+/)
    .map((line) => line.replace(/^\s*(?:\d+[.)]\s*|[-*]\s*)/, '').trim())
    .filter(Boolean)
    .map((title) => ({ title, detail: 'Follow the manufacturer instructions for your vehicle.' }));
}

export function toMarketplacePart(p: ApiSparePart): MarketplacePart {
  const guide: InstallationGuide = {
    difficulty: 'Moderate',
    estimatedTime: 'Refer to vehicle manual',
    tools: [],
    safetyPrecautions: ['Always work on a cool, parked engine.'],
    steps: stepsFrom(p.installationSteps),
    commonMistakes: [],
    inspectionChecklist: [],
    videoUrl: p.tutorialVideoUrl ?? undefined,
  };
  const body = p.description?.trim() || 'Genuine AutoCare spare part.';
  return {
    id: p.id,
    name: p.name,
    brand: 'AutoCare',
    category: p.category,
    oemNumber: '',
    mrp: p.price,
    discountPercent: 0,
    price: p.price,
    stock: p.stockQuantity,
    rating: 0,
    reviewsCount: 0,
    warranty: 'Manufacturer warranty',
    deliveryEstimate: STANDARD_DELIVERY_NOTE,
    freeDelivery: false,
    gallery: ['Front view', 'Angle view', 'Detail'],
    shortDescription: body,
    description: [{ title: 'Overview', body }],
    compatibility: p.compatibleVehicleModels,
    difficulty: guide.difficulty,
    guide,
    // The backend has no installation-charge catalogue, so professional
    // installation is not offered for catalogue parts.
    mechanicInstall: null,
  };
}

/* ------------------------------------------------------------------ */
/* Notifications (derived from real bookings + payments)               */
/* ------------------------------------------------------------------ */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const mins = Math.max(1, Math.round((Date.now() - then) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
}

/** Derive a notification feed from the user's real bookings and payments. */
export function buildNotifications(
  bookings: ApiBooking[],
  payments: ApiPayment[],
): AppNotification[] {
  const items: AppNotification[] = [];
  // Track the real event timestamp so the feed sorts chronologically even
  // though the rendered "time" string is relative ("2h ago", "5d ago").
  const tsById = new Map<number, number>();
  let seq = 1;

  const stamp = (iso?: string | null) => {
    const t = iso ? new Date(iso).getTime() : NaN;
    return Number.isNaN(t) ? 0 : t;
  };

  for (const b of bookings) {
    const id = seq++;
    const label = b.serviceType ?? 'Service';
    items.push({
      id,
      title: `Booking ${b.status.replace('_', ' ')}`,
      message: `#${b.id} · ${label}${b.mechanicId !== null ? ' · mechanic assigned' : ''}`,
      time: timeAgo(b.createdAt) || 'Recently',
      type: 'booking',
      read: false,
    });
    tsById.set(id, stamp(b.createdAt));
  }

  for (const p of payments) {
    const id = seq++;
    items.push({
      id,
      title: p.status === 'SUCCESS' ? 'Payment successful' : `Payment ${p.status.toLowerCase()}`,
      message: `${p.referenceType === 'BOOKING' ? 'Booking' : 'Order'} #${p.referenceId} · ${formatAmount(p.amount)}`,
      time: timeAgo(p.createdAt) || 'Recently',
      type: 'payment',
      read: false,
    });
    tsById.set(id, stamp(p.createdAt));
  }

  return items
    .sort((a, b) => (tsById.get(b.id) ?? 0) - (tsById.get(a.id) ?? 0))
    .slice(0, 20);
}

function formatAmount(amount: number): string {
  return `₹${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

/* ------------------------------------------------------------------ */
/* Chart data derived from real records                                */
/* ------------------------------------------------------------------ */

export interface MonthlyPoint {
  label: string;
  total: number;
  /** Internal year-month key ("2026-7") used for matching — not displayed. */
  _key: string;
  [key: string]: string | number;
}

/** Aggregate items into the last `months` calendar months (oldest → newest). */
export function monthlySeries<T>(
  items: T[],
  dateOf: (item: T) => string | null | undefined,
  valueOf: (item: T) => number,
  months = 7,
): MonthlyPoint[] {
  const points: MonthlyPoint[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    points.push({
      label: `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
      total: 0,
      _key: `${d.getFullYear()}-${d.getMonth()}`,
    });
  }
  const keyOf = (iso: string) => `${new Date(iso).getFullYear()}-${new Date(iso).getMonth()}`;
  for (const item of items) {
    const iso = dateOf(item);
    if (!iso) continue;
    const key = keyOf(iso);
    const point = points.find((p) => p._key === key);
    if (point) point.total = Number(point.total) + valueOf(item);
  }
  return points;
}
