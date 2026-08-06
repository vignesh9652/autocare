/**
 * Domain types for the Spare Parts Marketplace (customer-facing, mock-driven).
 *
 * Covers the two purchase modes:
 *  - DIY:  buy the part, install it yourself using the guided installation guide
 *  - MECHANIC: buy the part and book a certified AutoCare mechanic to install it
 */

export type InstallationDifficulty = 'Easy' | 'Moderate' | 'Expert';

export interface InstallationStep {
  title: string;
  detail: string;
}

/** Full DIY guidance shown on the installation guide page. */
export interface InstallationGuide {
  difficulty: InstallationDifficulty;
  /** Human friendly estimate, e.g. "15 minutes". */
  estimatedTime: string;
  tools: string[];
  safetyPrecautions: string[];
  steps: InstallationStep[];
  commonMistakes: string[];
  inspectionChecklist: string[];
  videoUrl?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

/** What it costs / takes to have a certified mechanic install this part. */
export interface MechanicInstallOption {
  installationCharge: number;
  estimatedTime: string;
  homeServiceAvailable: boolean;
}

/** A spare part with full marketplace metadata (superset of the API DTO). */
export interface MarketplacePart {
  id: number;
  name: string;
  brand: string;
  category: string;
  oemNumber: string;
  /** List price before discount. */
  mrp: number;
  discountPercent: number;
  /** Effective selling price. */
  price: number;
  stock: number;
  rating: number;
  reviewsCount: number;
  warranty: string;
  deliveryEstimate: string;
  freeDelivery: boolean;
  /** Gallery "views" rendered as stylised part visuals (front, angle, …). */
  gallery: string[];
  shortDescription: string;
  /** Long description broken into titled sections. */
  description: { title: string; body: string }[];
  compatibility: string[];
  difficulty: InstallationDifficulty;
  guide: InstallationGuide;
  /** null when professional installation does not apply (e.g. car covers). */
  mechanicInstall: MechanicInstallOption | null;
}

/** Shown when the part was recommended by a mechanic after an inspection. */
export interface MechanicRecommendation {
  mechanic: string;
  rating: number;
  experience: number;
  inspectionDate: string;
  reason: string;
  bookingId: string;
  vehicle: string;
  vehicleRegistration: string;
  inspectionSummary: string[];
  photos: string[];
  recommendedParts: string[];
}

export type PartOrderMode = 'DIY' | 'MECHANIC';

export interface OrderLine {
  partId: number;
  name: string;
  brand: string;
  quantity: number;
  price: number;
  lineTotal: number;
}

export interface OrderMechanic {
  name: string;
  date: string;
  time: string;
  homeService: boolean;
  charge: number;
}

export interface OrderTimelineStep {
  key: string;
  label: string;
  description: string;
  done: boolean;
  current: boolean;
}

/** A spare-parts order with its full lifecycle timeline. */
export interface MarketplaceOrder {
  id: string;
  lines: OrderLine[];
  /** Name of the customer who placed the order (shown to the mechanic). */
  customerName: string;
  mode: PartOrderMode;
  itemCost: number;
  gst: number;
  deliveryCharge: number;
  mechanicCharge: number;
  couponCode: string | null;
  couponDiscount: number;
  total: number;
  paymentMethod: string;
  estimatedDelivery: string;
  placedAt: string;
  status: string;
  address: string;
  mechanic: OrderMechanic | null;
  timeline: OrderTimelineStep[];
}

export interface CartLine {
  part: MarketplacePart;
  qty: number;
}

/** Mock coupons usable at checkout. */
export interface Coupon {
  code: string;
  label: string;
  description: string;
  /** Percentage discount (0 if flat). */
  percent: number;
  /** Flat discount (0 if percent). */
  flat: number;
  maxDiscount?: number;
  minOrder?: number;
}
