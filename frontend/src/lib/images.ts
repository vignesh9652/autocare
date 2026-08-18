// Central image assets for AutoCare.
// Uses stable Unsplash CDN URLs so every screen looks rich even before
// real uploads exist. Swap these for local assets or uploaded URLs anytime.

const u = (id: string, w = 900): string => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export { u };

// Base URL the app is served from when it talks to a remote API (same-origin in
// the default Docker/nginx setup, so empty). Used to qualify backend-returned
// relative URLs such as uploaded photos at /uploads/...
const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

/**
 * Resolve a backend-returned image URL into a loadable URL.
 * - Absolute http(s) URLs (Unsplash CDN, etc.) are returned untouched.
 * - Relative /uploads/** paths (locally stored uploads) are prefixed with the
 *   API base URL when one is configured, otherwise left relative so the nginx
 *   /uploads proxy (or Vite dev proxy) serves them.
 */
export function assetUrl(url?: string | null): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/uploads/') && API_BASE) return `${API_BASE}${url}`;
  return url;
}

// ─── Home / hero ────────────────────────────────────────────────────────────
export const HERO_BG = u('photo-1487754180451-c456f719a1fc', 1920); // dark garage/workshop
export const CTA_BG = u('photo-1503376780353-7e6692767b70', 1600);   // car on road

// ─── Services (home page cards) ─────────────────────────────────────────────
export const SERVICE_IMAGES: Record<string, string> = {
  'Oil Change': u('photo-1530046339160-ce3e530c7d2f'),
  'Brake Repair': u('photo-1558618666-fcd25c85cd64'),
  'Engine Service': u('photo-1486262715619-67b85e0b08d3'),
  'AC Repair': u('photo-1621905251189-08b45d6a269e'),
  'Tire Change': u('photo-1492144534655-ae79c964c9d7'),
  'Battery Check': u('photo-1552519507-da3b142c6e3d'),
};

// Generic workshop shot used for catalogue services without a dedicated image.
export const SERVICE_FALLBACK = u('photo-1486262715619-67b85e0b08d3');

export const HOW_IT_WORKS_IMG = u('photo-1558618666-fcd25c85cd64');
export const TRUST_IMG = u('photo-1635776062127-d379bfcba9f8', 1200); // mechanic at work

// ─── Auth page backgrounds ──────────────────────────────────────────────────
export const LOGIN_BG = u('photo-1486262715619-67b85e0b08d3', 1920); // garage bay with a car on a lift
export const MECHANIC_REGISTER_BG = u('photo-1504222490345-c075b6008014', 1920); // well-lit mechanic at work under the hood

// ─── Booking hero ───────────────────────────────────────────────────────────
export const BOOKING_BG = u('photo-1487754180451-c456f719a1fc', 1920); // dark workshop/garage with a car on a lift

// ─── Spare parts — category fallbacks ───────────────────────────────────────
export const PART_IMAGES: Record<string, string> = {
  ENGINE: u('photo-1530046339160-ce3e530c7d2f'),
  BRAKES: u('photo-1558618666-fcd25c85cd64'),
  ELECTRICAL: u('photo-1552519507-da3b142c6e3d'),
  FILTERS: u('photo-1530046339160-ce3e530c7d2f'),
  SUSPENSION: u('photo-1492144534655-ae79c964c9d7'),
  EXHAUST: u('photo-1558618666-fcd25c85cd64'),
  COOLING: u('photo-1621905251189-08b45d6a269e'),
  BODY: u('photo-1503376780353-7e6692767b70'),
  INTERIOR: u('photo-1625047509168-a7026f36de04'),
  DEFAULT: u('photo-1530046339160-ce3e530c7d2f'),
};

export function partImageUrl(category?: string | null, uploadedUrl?: string | null): string {
  if (uploadedUrl) return assetUrl(uploadedUrl);
  if (!category) return PART_IMAGES.DEFAULT;
  const key = category.toUpperCase();
  return PART_IMAGES[key] ?? PART_IMAGES.DEFAULT;
}

// ─── Mechanics — dummy portraits ────────────────────────────────────────────
const MECHANIC_PORTRAITS = [
  u('photo-1507003211169-0a1dd7228f2d', 600),
  u('photo-1500648767791-00dcc994a43e', 600),
  u('photo-1506794778202-cad84cf45f1d', 600),
  u('photo-1472099645785-5658abf4ff4e', 600),
  u('photo-1573497019940-1c28c88b4f3e', 600),
  u('photo-1580489944761-15a19d654956', 600),
  u('photo-1506794778202-cad84cf45f1d', 600),
];

export function mechanicImageUrl(id: number): string {
  return MECHANIC_PORTRAITS[Math.abs(id) % MECHANIC_PORTRAITS.length];
}
