import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarPlus, Check, Crosshair, Loader2, MapPin, Star, Upload, Zap } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/Button';
import Avatar from '@/components/ui/Avatar';
import Toggle from '@/components/ui/Toggle';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { useApiData } from '@/hooks/useApiData';
import { getVehicles } from '@/api/vehicleApi';
import { getMechanics } from '@/api/mechanicApi';
import { createBooking } from '@/api/bookingApi';
import type { BookingRequest, Mechanic as ApiMechanic } from '@/types';
import type { Mechanic as DashMechanic } from '@/types/dashboard';
import { toDashMechanic } from '@/utils/apiMappers';
import { cn } from '@/utils/cn';

const SERVICE_CATEGORIES = [
  'Engine Repair', 'AC Service', 'Brake Service', 'Battery Replacement',
  'Wheel Alignment', 'Oil Change', 'Transmission Service', 'Denting & Painting',
  'Car Detailing', 'EV Service', 'General Inspection',
];

type SortKey = 'distance' | 'rating' | 'availability' | 'jobs';

interface MechanicRow {
  api: ApiMechanic;
  dash: DashMechanic;
  /** Straight-line distance from the customer's shared location, or null when unknown. */
  distanceKm: number | null;
}

/** Great-circle distance between two coordinates (Haversine), in kilometres. */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function BookService() {
  const navigate = useNavigate();
  const vehicles = useApiData(() => getVehicles(), []);
  const mechanics = useApiData(() => getMechanics(), []);
  const [vehicleId, setVehicleId] = useState<number | ''>('');
  const [category, setCategory] = useState(SERVICE_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [location, setLocation] = useState('');
  const [emergency, setEmergency] = useState(false);
  const [selectedMechanic, setSelectedMechanic] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const { success, error, info } = useToast();

  // Shared location (latitude & longitude) — powers the nearby search.
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('distance');
  const [search, setSearch] = useState('');

  const loading = vehicles.loading || mechanics.loading;
  const dashVehicles = useMemo(
    () =>
      (vehicles.data ?? []).map((v) => ({
        id: v.id,
        label: `${v.make} ${v.model} · ${v.registrationNumber}`,
      })),
    [vehicles.data],
  );
  const serviceAreaById = useMemo(() => {
    const map = new Map<number, string>();
    for (const m of mechanics.data ?? []) map.set(m.id, m.serviceArea);
    return map;
  }, [mechanics.data]);

  const hasLocation =
    lat.trim() !== '' && lng.trim() !== '' && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));
  const myLat = Number(lat);
  const myLng = Number(lng);

  // Mechanics with computed distance, filtered by the search query and sorted
  // by the chosen criterion.
  const mechRows = useMemo<MechanicRow[]>(() => {
    const query = search.trim().toLowerCase();
    const rows: MechanicRow[] = (mechanics.data ?? [])
      .filter(
        (m) =>
          !query ||
          m.name.toLowerCase().includes(query) ||
          m.skills.some((s) => s.toLowerCase().includes(query)) ||
          m.serviceArea.toLowerCase().includes(query),
      )
      .map((m) => ({
        api: m,
        dash: toDashMechanic(m),
        distanceKm:
          hasLocation && m.latitude != null && m.longitude != null
            ? haversineKm(myLat, myLng, m.latitude, m.longitude)
            : null,
      }));
    return [...rows].sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.dash.rating - a.dash.rating;
        case 'availability':
          return Number(b.dash.available) - Number(a.dash.available);
        case 'jobs':
          return b.dash.jobsCompleted - a.dash.jobsCompleted;
        case 'distance':
        default: {
          const da = a.distanceKm ?? Number.POSITIVE_INFINITY;
          const db = b.distanceKm ?? Number.POSITIVE_INFINITY;
          return da - db;
        }
      }
    });
  }, [mechanics.data, sortBy, hasLocation, myLat, myLng, search]);

  const useMyLocation = () => {
    setLocationError('');
    if (!('geolocation' in navigator)) {
      setLocationError('Geolocation is not supported by this browser — enter coordinates manually.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(String(pos.coords.latitude));
        setLng(String(pos.coords.longitude));
        setLocating(false);
      },
      () => {
        setLocationError('Could not fetch your location — enter it manually below.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!vehicleId) {
      info('Select a vehicle', 'Please choose a vehicle to continue booking.');
      return;
    }
    if (!date) {
      info('Pick a date', 'Please choose a preferred date.');
      return;
    }
    const chosen = mechRows.find((m) => m.api.id === selectedMechanic);
    setBusy(true);
    try {
      const payload: BookingRequest = {
        vehicleId: Number(vehicleId),
        serviceType: category,
        scheduledAt: `${date}T${time}:00`,
        address: location.trim() || 'Workshop pickup',
        preferredSkill: chosen?.api.skills[0],
      };
      await createBooking(payload);
      success(
        'Booking request sent!',
        `${category} for your vehicle on ${date} at ${time}. We'll assign the best available mechanic.`,
      );
      navigate('/customer/bookings');
    } catch (err) {
      error('Booking failed', 'We could not place your booking. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Book a Service"
        subtitle="Share your location, find nearby mechanics, and book in minutes"
        icon={<CalendarPlus className="h-5 w-5" />}
      />

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-5">
        {/* Booking form */}
        <div className="card space-y-4 p-6 lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Service Details</h3>

          <div>
            <label className="label">Select Vehicle</label>
            {loading ? (
              <div className="h-10 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            ) : dashVehicles.length === 0 ? (
              <EmptyState title="No vehicles" description="Add a vehicle first to book a service." />
            ) : (
              <select className="select" value={vehicleId} onChange={(e) => setVehicleId(Number(e.target.value))}>
                <option value="">Choose a vehicle…</option>
                {dashVehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.label}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="label">Service Category</label>
            <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
              {SERVICE_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Problem Description</label>
            <textarea
              className="input min-h-24 resize-y"
              placeholder="Describe the issue you're facing… (e.g. engine light on, unusual noise)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Upload images */}
          <div>
            <label className="label">Upload Images (optional)</label>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-300 px-4 py-6 text-center transition-colors hover:border-brand-400 hover:bg-brand-50/40 dark:border-slate-700 dark:hover:border-brand-500/50 dark:hover:bg-brand-500/5">
              <Upload className="h-6 w-6 text-slate-400 dark:text-slate-500" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {files.length > 0 ? `${files.length} image(s) selected` : 'Click to upload photos'}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">JPG or PNG, up to 5MB each</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Preferred Date</label>
              <input type="date" className="input" required value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="label">Preferred Time</label>
              <input type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label">Service Address</label>
            <input
              className="input"
              placeholder="e.g. 12, 5th Main, Indiranagar, Bengaluru"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700">
            <Toggle
              checked={emergency}
              onChange={setEmergency}
              label="Emergency service"
              description="Priority dispatch within 2 hours (extra ₹500)"
            />
          </div>

          <Button type="submit" className="w-full" disabled={busy || loading}>
            <Check className="h-4 w-4" /> {busy ? 'Sending…' : 'Confirm Booking'}
          </Button>
        </div>

        {/* Mechanics */}
        <div className="space-y-4 lg:col-span-3">
          {/* Share location */}
          <div className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Your location</p>
                {hasLocation && <Badge variant="success" dot>Location set</Badge>}
              </div>
              <button
                type="button"
                onClick={useMyLocation}
                disabled={locating}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-600 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:border-brand-500/50 dark:hover:text-brand-400"
              >
                {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Crosshair className="h-3.5 w-3.5" />}
                {locating ? 'Locating…' : 'Share my location'}
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="label">Latitude</label>
                <input
                  className="input"
                  type="number"
                  step="any"
                  placeholder="12.9352"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Longitude</label>
                <input
                  className="input"
                  type="number"
                  step="any"
                  placeholder="77.6245"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                />
              </div>
            </div>
            {locationError && <p className="mt-2 text-xs font-medium text-red-500">{locationError}</p>}
            {!hasLocation && !locationError && (
              <p className="mt-2 text-[11px] text-slate-400">
                Share your location to see mechanics sorted by distance (km).
              </p>
            )}
          </div>

          {/* Header + search + sort */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Nearby Mechanics
              <span className="ml-2 text-xs font-normal text-slate-400">
                {mechRows.length} found{hasLocation ? ' near you' : ''}
              </span>
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <input
                className="input !w-48 !py-1.5 text-xs"
                type="search"
                placeholder="Search name, skill, area…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search mechanics"
              />
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Sort by</label>
              <select
                className="select !w-auto !py-1.5 text-xs"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                aria-label="Sort mechanics"
              >
                <option value="distance">Distance (km)</option>
                <option value="rating">Rating</option>
                <option value="availability">Availability</option>
                <option value="jobs">Jobs completed</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="card h-28 animate-pulse" />)}
            </div>
          ) : mechRows.length === 0 ? (
            <div className="card">
              <EmptyState
                title="No mechanics registered"
                description="There are no mechanics in your area yet — you can still request a booking and we'll notify you."
              />
            </div>
          ) : (
            <div className="space-y-3">
              {mechRows.map(({ api, dash: m, distanceKm }) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setSelectedMechanic(m.id)}
                  className={cn(
                    'flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all',
                    selectedMechanic === m.id
                      ? 'border-brand-400 bg-brand-50/60 shadow-md ring-2 ring-brand-500/20 dark:border-brand-500 dark:bg-brand-500/10'
                      : 'card hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:hover:border-brand-500/40',
                    !m.available && 'opacity-55',
                  )}
                >
                  <Avatar name={m.name} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{m.name}</p>
                      {!m.available && <Badge variant="neutral">Busy</Badge>}
                      {selectedMechanic === m.id && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {m.jobsCompleted.toLocaleString('en-IN')} jobs done
                      {serviceAreaById.get(m.id) ? ` · ${serviceAreaById.get(m.id)}` : ''}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {api.skills.map((s) => (
                        <span key={s} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="shrink-0 space-y-1.5 text-right text-xs">
                    {hasLocation && (
                      <p className="flex items-center justify-end gap-1 font-bold text-brand-600 dark:text-brand-400">
                        <MapPin className="h-3.5 w-3.5" />
                        {distanceKm != null ? `${distanceKm.toFixed(1)} km` : '—'}
                      </p>
                    )}
                    <p className="flex items-center justify-end gap-1 font-bold text-slate-700 dark:text-slate-200">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {m.rating.toFixed(1)}
                    </p>
                    <p className="flex items-center justify-end gap-1 text-slate-500 dark:text-slate-400">
                      <MapPin className="h-3.5 w-3.5" /> {serviceAreaById.get(m.id) ?? '—'}
                    </p>
                    <Badge variant={m.available ? 'success' : 'warning'} dot>{m.available ? 'Available' : 'Busy'}</Badge>
                  </div>
                </button>
              ))}
            </div>
          )}

          <p className="text-xs text-slate-500 dark:text-slate-400">
            💡 The mechanic you pick sets your <span className="font-semibold">preferred skill</span> — we'll confirm
            the closest available specialist when your booking is accepted.
          </p>

          {emergency && (
            <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
              <Zap className="h-5 w-5 shrink-0" />
              <p className="text-xs">
                Emergency mode is on — nearby mechanics will be notified immediately and the earliest available
                will be dispatched within 2 hours.
              </p>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
