// Live location detection for registration forms.
// Uses the browser Geolocation API and reverse-geocodes to a readable
// area name via OpenStreetMap's free Nominatim service (no API key needed).

export interface DetectedLocation {
  latitude: number;
  longitude: number;
  area: string;
  accuracy?: number;
}

export function isGeolocationSupported(): boolean {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator;
}

/** Great-circle distance between two coordinates in kilometres (haversine). */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Human-friendly distance label, e.g. "1.2 km" or "12 km". */
export function formatDistanceKm(km: number): string {
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

function coordsLabel(lat: number, lng: number): string {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

/** Resolve a readable area name for coordinates (best-effort, never throws). */
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=13`,
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) return coordsLabel(lat, lng);
    const data = (await res.json()) as {
      address?: { city?: string; town?: string; village?: string; suburb?: string; state?: string; country?: string };
    };
    const a = data.address ?? {};
    const city = a.city ?? a.town ?? a.village ?? a.suburb;
    const parts = [city, a.state].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : coordsLabel(lat, lng);
  } catch {
    return coordsLabel(lat, lng);
  }
}

/**
 * Request the user's current position.
 * Resolves with coordinates + a readable area name; rejects when the user
 * denies permission or the device has no GPS.
 */
export function detectLiveLocation(): Promise<DetectedLocation> {
  return new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const area = await reverseGeocode(latitude, longitude);
        resolve({ latitude, longitude, area, accuracy });
      },
      (err) => {
        const message =
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied. Please allow access or type your area manually.'
            : err.code === err.POSITION_UNAVAILABLE
              ? 'Your location could not be determined right now.'
              : 'Location request timed out. Please try again.';
        reject(new Error(message));
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 30_000 }
    );
  });
}
