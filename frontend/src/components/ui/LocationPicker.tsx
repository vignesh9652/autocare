import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Crosshair, Loader2 } from 'lucide-react';
import { detectLiveLocation, isGeolocationSupported } from '@/lib/geolocation';
import { toast } from '@/stores/toast-store';
import 'leaflet/dist/leaflet.css';

/* ── Fix default Leaflet marker icons (Vite bundling strips them) ──────────── */

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/* ── Types ────────────────────────────────────────────────────────────────── */

export interface PickedLocation {
  latitude: number;
  longitude: number;
  area: string;
  pincode?: string;
}

interface LocationPickerProps {
  value: PickedLocation | null;
  onChange: (loc: PickedLocation) => void;
  height?: string;
}

/* ── Default center (India) ───────────────────────────────────────────────── */

const DEFAULT_CENTER: L.LatLngTuple = [20.5937, 78.9629];
const DEFAULT_ZOOM = 5;

/* ── Draggable marker + click-to-move ─────────────────────────────────────── */

function DragPin({
  position,
  onMove,
}: {
  position: L.LatLngTuple;
  onMove: (lat: number, lng: number) => void;
}) {
  const markerRef = useRef<L.Marker>(null);

  return (
    <Marker
      position={position}
      draggable
      ref={markerRef}
      eventHandlers={{
        dragend() {
          const m = markerRef.current;
          if (!m) return;
          const { lat, lng } = m.getLatLng();
          onMove(lat, lng);
        },
      }}
    />
  );
}

/** Click anywhere on the map to move the pin there. */
function ClickHandler({ onMove }: { onMove: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMove(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/** Fly the map to a new centre when position changes. */
function FlyTo({ position }: { position: L.LatLngTuple }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(position, 15, { duration: 1.2 });
  }, [position, map]);
  return null;
}

/* ── Main component ───────────────────────────────────────────────────────── */

export function LocationPicker({ value, onChange, height = '350px' }: LocationPickerProps) {
  const [detecting, setDetecting] = useState(false);
  const [position, setPosition] = useState<L.LatLngTuple>(
    value ? [value.latitude, value.longitude] : DEFAULT_CENTER,
  );
  const zoomRef = useRef(value ? 15 : DEFAULT_ZOOM);

  /** Reverse-geocode coords to area + pincode, then notify parent. */
  const resolveAndUpdate = async (lat: number, lng: number) => {
    setPosition([lat, lng]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16`,
        { headers: { Accept: 'application/json' } },
      );
      if (res.ok) {
        const data = (await res.json()) as {
          display_name?: string;
          address?: {
            city?: string;
            town?: string;
            village?: string;
            suburb?: string;
            state?: string;
            postcode?: string;
          };
        };
        const a = data.address ?? {};
        const city = a.city ?? a.town ?? a.village ?? a.suburb;
        const parts = [city, a.state].filter(Boolean);
        const area = parts.length > 0 ? parts.join(', ') : data.display_name ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        onChange({ latitude: lat, longitude: lng, area, pincode: a.postcode });
        return;
      }
    } catch {
      /* fall through */
    }
    onChange({ latitude: lat, longitude: lng, area: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
  };

  /** Use browser GPS to centre the map. */
  const handleDetect = async () => {
    if (!isGeolocationSupported()) {
      toast('Geolocation is not supported by this browser.', 'error');
      return;
    }
    setDetecting(true);
    try {
      const loc = await detectLiveLocation();
      setPosition([loc.latitude, loc.longitude]);
      zoomRef.current = 15;
      onChange({ latitude: loc.latitude, longitude: loc.longitude, area: loc.area, pincode: loc.pincode });
      toast(`Location detected — ${loc.area}${loc.pincode ? ` (${loc.pincode})` : ''}`, 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not detect location', 'error');
    } finally {
      setDetecting(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-200 dark:border-ink-700">
      {/* Detect button */}
      <div className="flex items-center justify-between border-b border-ink-200 bg-ink-50 px-4 py-2.5 dark:border-ink-700 dark:bg-ink-900">
        <p className="text-xs font-semibold text-ink-600 dark:text-ink-300">
          Click the map or drag the pin to set your exact location
        </p>
        <button
          type="button"
          onClick={() => void handleDetect()}
          disabled={detecting}
          className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
        >
          {detecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Crosshair className="h-3.5 w-3.5" />}
          {detecting ? 'Detecting…' : 'Use GPS'}
        </button>
      </div>

      {/* Map */}
      <div style={{ height }}>
        <MapContainer
          center={position}
          zoom={zoomRef.current}
          scrollWheelZoom
          className="h-full w-full"
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onMove={(lat, lng) => void resolveAndUpdate(lat, lng)} />
          <DragPin position={position} onMove={(lat, lng) => void resolveAndUpdate(lat, lng)} />
          <FlyTo position={position} />
        </MapContainer>
      </div>

      {/* Coordinates display */}
      {value && (
        <div className="border-t border-ink-200 bg-ink-50 px-4 py-2 dark:border-ink-700 dark:bg-ink-900">
          <p className="text-xs text-ink-500 dark:text-ink-400">
            📍 <span className="font-mono font-medium text-ink-700 dark:text-ink-200">
              {value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}
            </span>
            {value.pincode && (
              <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
                PIN {value.pincode}
              </span>
            )}
            {value.area && (
              <span className="ml-2 text-ink-500">— {value.area}</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
