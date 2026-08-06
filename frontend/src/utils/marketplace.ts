/**
 * Spare parts marketplace helpers — pricing, coupons and order timelines.
 * These are pure business rules (not demo data), so they live here instead of
 * the (now removed) mock catalogue.
 */
import type { CartLine, Coupon, MarketplaceOrder, OrderTimelineStep, PartOrderMode } from '@/types';

/* ------------------------------------------------------------------ */
/* Pricing constants & helpers                                         */
/* ------------------------------------------------------------------ */

export const GST_RATE = 0.18;
const FREE_DELIVERY_THRESHOLD = 999;
const STANDARD_DELIVERY_CHARGE = 99;

/** Coupons a customer can apply at checkout. */
const MARKETPLACE_COUPONS: Coupon[] = [
  { code: 'AUTOCARE10', label: '10% off', description: '10% off up to ₹500 on orders above ₹1,500', percent: 10, flat: 0, maxDiscount: 500, minOrder: 1500 },
  { code: 'WELCOME150', label: '₹150 off', description: 'Flat ₹150 off on your first order above ₹999', percent: 0, flat: 150, minOrder: 999 },
];

export function getCoupon(code: string): Coupon | undefined {
  return MARKETPLACE_COUPONS.find((c) => c.code.toLowerCase() === code.trim().toLowerCase());
}

export function couponDiscountFor(subtotal: number, coupon: Coupon | null): number {
  if (!coupon) return 0;
  if (subtotal < (coupon.minOrder ?? 0)) return 0;
  const raw = coupon.percent > 0 ? (subtotal * coupon.percent) / 100 : coupon.flat;
  return Math.min(raw, coupon.maxDiscount ?? raw);
}

export function deliveryChargeFor(subtotal: number): number {
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_CHARGE;
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/* ------------------------------------------------------------------ */
/* Order timeline                                                      */
/* ------------------------------------------------------------------ */

interface TimelineDef {
  key: string;
  label: string;
  description: string;
}

const DIY_TIMELINE: TimelineDef[] = [
  { key: 'placed', label: 'Order Placed', description: 'We have received your order' },
  { key: 'payment', label: 'Payment Successful', description: 'Payment confirmed securely' },
  { key: 'packed', label: 'Packed', description: 'Your part is packed and labelled' },
  { key: 'out-for-delivery', label: 'Out for Delivery', description: 'Part is on its way to you' },
  { key: 'delivered', label: 'Delivered', description: 'Part delivered to your address' },
  { key: 'guide', label: 'Installation Guide Available', description: 'Step-by-step DIY guidance unlocked' },
  { key: 'completed', label: 'Order Completed', description: 'Install done — enjoy your new part' },
];

const MECHANIC_TIMELINE: TimelineDef[] = [
  { key: 'placed', label: 'Order Placed', description: 'We have received your order' },
  { key: 'payment', label: 'Payment Successful', description: 'Payment confirmed securely' },
  { key: 'packed', label: 'Packed', description: 'Your part is packed and labelled' },
  { key: 'out-for-delivery', label: 'Out for Delivery', description: 'Part is on its way to you' },
  { key: 'delivered', label: 'Delivered', description: 'Part delivered to your address' },
  { key: 'waiting-mechanic', label: 'Waiting for Mechanic', description: 'A mechanic is being assigned to you' },
  { key: 'mechanic-assigned', label: 'Mechanic Assigned', description: 'Your certified mechanic is confirmed' },
  { key: 'installed', label: 'Installation Completed', description: 'Mechanic installed the part' },
  { key: 'rating', label: 'Customer Rating', description: 'Rate your installation experience' },
  { key: 'complete', label: 'Order Complete', description: 'Invoice generated — order completed' },
];

export function timelineFor(mode: PartOrderMode, currentKey: string): OrderTimelineStep[] {
  const defs = mode === 'DIY' ? DIY_TIMELINE : MECHANIC_TIMELINE;
  const currentIndex = Math.max(0, defs.findIndex((s) => s.key === currentKey));
  const isLast = currentIndex === defs.length - 1;
  return defs.map((s, i) => ({
    ...s,
    // A completed order's final step is fully done (check), not in progress (spinner).
    done: i < currentIndex || (isLast && i === currentIndex),
    current: i === currentIndex && !isLast,
  }));
}

/** Human-friendly status label for a timeline step key. */
export function statusLabelFor(key: string): string {
  const labels: Record<string, string> = {
    placed: 'Placed',
    payment: 'Payment Successful',
    packed: 'Packed',
    'out-for-delivery': 'Out for Delivery',
    delivered: 'Delivered',
    guide: 'Installation Guide Available',
    completed: 'Completed',
    'waiting-mechanic': 'Waiting for Mechanic',
    'mechanic-assigned': 'Mechanic Assigned',
    installed: 'Installation Completed',
    rating: 'Awaiting Customer Rating',
    complete: 'Order Complete',
  };
  return labels[key] ?? key;
}

/** The current (in-progress) timeline step key for an order. */
export function currentStepKey(timeline: OrderTimelineStep[]): string {
  return timeline.find((s) => s.current)?.key ?? timeline[timeline.length - 1]?.key ?? '';
}

/* ------------------------------------------------------------------ */
/* Orders                                                              */
/* ------------------------------------------------------------------ */

export function nextOrderId(orders: MarketplaceOrder[]): string {
  const max = orders.reduce((acc, o) => {
    const n = Number(o.id.replace('ORD-', ''));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 1000);
  return `ORD-${max + 1}`;
}

/** Build the cart line summaries used by the checkout page. */
export function cartToOrderLines(lines: CartLine[]): MarketplaceOrder['lines'] {
  return lines.map((l) => ({
    partId: l.part.id,
    name: l.part.name,
    brand: l.part.brand,
    quantity: l.qty,
    price: l.part.price,
    lineTotal: roundMoney(l.part.price * l.qty),
  }));
}
