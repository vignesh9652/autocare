import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';import { ArrowLeft,
  ArrowRight,
  CalendarClock,
  Car,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Crosshair,
  IndianRupee,
  Info,
  Loader2,
  LocateFixed,
  MapPin,
  Navigation,
  Plus,
  Sparkles,
  Star,
  UserCheck,
  Wrench,
  X,
} from 'lucide-react';
import { LocationPicker, PickedLocation } from '@/components/ui/LocationPicker';
import { useQuery } from '@tanstack/react-query';
import { vehicleApi, bookingApi, mechanicApi, serviceApi, getErrorMessage } from '@/lib/api';
import { assetUrl, BOOKING_BG, mechanicImageUrl } from '@/lib/images';
import { isGeolocationSupported, detectLiveLocation, haversineKm, formatDistanceKm } from '@/lib/geolocation';
import { toast } from '@/stores/toast-store';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Stepper } from '@/components/ui/Stepper';
import { EmptyState, ErrorState, LoadingScreen } from '@/components/ui/Feedback';
import { cn, formatCurrency, pluralize } from '@/lib/utils';
import { MechanicResponse, VehicleResponse } from '@/types';

const STEPS = ['Vehicle', 'Service', 'Slot', 'Address', 'Mechanic', 'Done'];

/** Published service catalogue with transparent starting estimates. */
const SERVICES = [
  { name: 'General Service', desc: 'Oil change, filters, 60-point check', price: 1499 },
  { name: 'Brake Repair', desc: 'Pads, discs & brake fluid inspection', price: 2499 },
  { name: 'Engine Diagnostics', desc: 'Computerised engine health scan', price: 1299 },
  { name: 'AC Service', desc: 'Gas top-up, cooling coil cleaning', price: 1899 },
  { name: 'Battery Replacement', desc: 'On-site battery testing & swap', price: 999 },
  { name: 'Tyre Care', desc: 'Rotation, balancing & pressure check', price: 1099 },
  { name: 'Detailing & Wash', desc: 'Deep interior & exterior detailing', price: 1999 },
  { name: 'Insurance Claim Support', desc: 'Assistance with claim paperwork', price: 499 },
];

const RADII = [5, 10, 25, 50];

/** Matches service names ignoring case and extra whitespace ("brake  repair" → "Brake Repair"). */
const normalizeName = (name: string) => name.trim().toLowerCase().replace(/\s+/g, ' ');

interface ServiceOption {
  name: string;
  desc: string;
  price: number;
}

interface CustomerLocation {
  latitude: number;
  longitude: number;
  area: string;
  accuracy?: number;
}

interface MechanicWithDistance extends MechanicResponse {
  distanceKm?: number;
}

export function BookServiceScreen() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [vehicleId, setVehicleId] = useState<number | ''>('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [customService, setCustomService] = useState('');
  const [scheduledAt, setScheduledAt] = useState<string>('');
  const [address, setAddress] = useState('');
  const [pickedLocation, setPickedLocation] = useState<PickedLocation | null>(null);
  const [userEditedAddress, setUserEditedAddress] = useState(false);
  const [preferredSkill, setPreferredSkill] = useState('');
  const [locating, setLocating] = useState(false);
  const [location, setLocation] = useState<CustomerLocation | null>(null);
  const [radius, setRadius] = useState(25);
  const [mechanicId, setMechanicId] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);

  const { data: vehicles, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-vehicles'],
    queryFn: vehicleApi.getMyVehicles,
  });

  const { data: mechanics, isLoading: loadingMechanics, isError: mechanicsError, refetch: refetchMechanics } = useQuery({
    queryKey: ['available-mechanics'],
    queryFn: () => mechanicApi.getAll({ available: true }),
  });

  // Platform-controlled prices from the service catalogue; the bundled list is
  // only a fallback when the catalogue API is unreachable. This is the single
  // source of truth for both the picker and the manual-entry validation below,
  // so a typed-in service always resolves to its catalogue price.
  const { data: catalogServices } = useQuery({
    queryKey: ['services-catalog'],
    queryFn: serviceApi.getAll,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const serviceOptions = useMemo<ServiceOption[]>(
    () =>
      catalogServices?.length
        ? catalogServices.map((s) => ({
            name: s.serviceName,
            desc: s.description ?? '',
            price: s.basePrice,
          }))
        : SERVICES,
    [catalogServices]
  );

  /** Live estimate — sum of every selected service's platform price. */
  const estimatedAmount = useMemo(() => {
    return serviceOptions
      .filter((s) => selectedServices.includes(s.name))
      .reduce((sum, s) => sum + s.price, 0);
  }, [serviceOptions, selectedServices]);

  const selectedMechanic = useMemo<MechanicWithDistance | undefined>(
    () => (mechanics ?? []).find((m) => m.id === mechanicId),
    [mechanics, mechanicId]
  );

  const canNext = useMemo(() => {
    if (step === 0) return vehicleId !== '';
    if (step === 1) return selectedServices.length > 0;
    if (step === 2) return !!scheduledAt;
    if (step === 3) return !!(pickedLocation || location) || address.trim().length >= 8;
    if (step === 4) return mechanicId !== '';
    return false;
  }, [step, vehicleId, selectedServices, scheduledAt, address, pickedLocation, location, mechanicId]);

  // Auto-fill address from map reverse geocode (only when user hasn't manually typed)
  useEffect(() => {
    if (pickedLocation?.area && !userEditedAddress) {
      setAddress(pickedLocation.area);
    }
  }, [pickedLocation, userEditedAddress]);

  const toggleService = (name: string) => {
    setSelectedServices((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  const addCustomService = () => {
    const typed = customService.trim();
    if (!typed) return;
    if (selectedServices.some((s) => normalizeName(s) === normalizeName(typed))) {
      toast('That service is already selected', 'error');
      return;
    }
    // Manually typed services are validated against the platform catalogue and
    // priced from it — customers can't invent services or set their own price.
    const match = serviceOptions.find((s) => normalizeName(s.name) === normalizeName(typed));
    if (!match) {
      toast(`"${typed}" isn't available in our catalogue — please pick from the listed services`, 'error');
      return;
    }
    setSelectedServices((prev) => [...prev, match.name]);
    setCustomService('');
    toast(`"${match.name}" added — ${formatCurrency(match.price)}`, 'success');
  };

  /**
   * Captures the customer's exact position (lat/lng + accuracy) once and
   * reuses it in both the address step (prefilled GPS text + saved coords)
   * and the mechanic step (distance filtering).
   */
  const captureLocation = async () => {
    if (!isGeolocationSupported()) {
      toast('Geolocation is not supported by this browser. Please type your address manually.', 'error');
      return;
    }
    setLocating(true);
    try {
      const loc = await detectLiveLocation();
      setLocation({ latitude: loc.latitude, longitude: loc.longitude, area: loc.area, accuracy: loc.accuracy });
      toast(`Finding mechanics near ${loc.area}`, 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not detect your location', 'error');
    } finally {
      setLocating(false);
    }
  };

  const visibleMechanics = useMemo<MechanicWithDistance[]>(() => {
    let list = (mechanics ?? []).map((m) => ({ ...m })) as MechanicWithDistance[];
    if (location) {
      for (const m of list) {
        if (m.latitude != null && m.longitude != null) {
          m.distanceKm = haversineKm(location.latitude, location.longitude, m.latitude, m.longitude);
        }
      }
      list = list.filter((m) => m.distanceKm === undefined || m.distanceKm <= radius);
      list.sort((a, b) => {
        if (a.distanceKm === undefined && b.distanceKm === undefined) return 0;
        if (a.distanceKm === undefined) return 1;
        if (b.distanceKm === undefined) return -1;
        return a.distanceKm - b.distanceKm;
      });
    }
    return list;
  }, [mechanics, location, radius]);

  const submit = async () => {
    setSubmitting(true);
    try {
      const finalLocation = pickedLocation || location;
      await bookingApi.create({
        vehicleId: vehicleId as number,
        serviceType: selectedServices.join(' + '),
        scheduledAt: new Date(scheduledAt).toISOString(),
        address: pickedLocation ? (address || pickedLocation.area) : address,
        latitude: finalLocation?.latitude,
        longitude: finalLocation?.longitude,
        mechanicId: mechanicId as number,
        preferredSkill: preferredSkill || undefined,
        serviceArea: preferredSkill || undefined,
      });
      toast(`Booking placed! ${selectedMechanic ? selectedMechanic.name : 'Your mechanic'} will confirm shortly.`, 'success');
      setStep(5);
      setTimeout(() => navigate(`/dashboard/bookings`), 1800);
    } catch (err) {
      toast(getErrorMessage(err), 'error');
      setSubmitting(false);
    }
  };

  if (isLoading) return <LoadingScreen label="Loading your vehicles…" />;
  if (isError) return <ErrorState message="Could not load vehicles" onRetry={() => refetch()} />;
  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="container-app py-16">
        <EmptyState
          icon={<Car className="h-6 w-6" />}
          title="Add a vehicle first"
          description="You need at least one vehicle before booking a doorstep service."
          action={<Link to="/dashboard/vehicles"><Button>Add My Vehicle</Button></Link>}
        />
      </div>
    );
  }

  return (
    <div className="container-app py-10">
      {/* Hero — booking background image */}
      <div className="relative mb-10 overflow-hidden rounded-3xl bg-ink-950 shadow-2xl shadow-ink-950/20">
        <img src={BOOKING_BG} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950/95 via-ink-950/75 to-ink-950/30" />
        <div className="relative flex flex-col gap-4 px-7 py-10 sm:px-10 sm:py-12">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-500/20 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-brand-300 ring-1 ring-brand-400/40 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> Free doorstep pickup
          </span>
          <h1 className="font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl">
            Book a Service
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-ink-200 sm:text-base">
            Pick your services, lock in your exact location and get an instant estimate —
            our mechanic confirms the final amount only after inspecting your vehicle.
          </p>
          <div className="mt-1 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-white ring-1 ring-white/20 backdrop-blur">
              <Crosshair className="h-3.5 w-3.5 text-emerald-300" /> Exact GPS location
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-white ring-1 ring-white/20 backdrop-blur">
              <IndianRupee className="h-3.5 w-3.5 text-emerald-300" /> Instant estimate
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-white ring-1 ring-white/20 backdrop-blur">
              <ClipboardCheck className="h-3.5 w-3.5 text-emerald-300" /> Final price after inspection
            </span>
          </div>
        </div>
      </div>

      <Stepper steps={STEPS} current={step} />

      <div className="mx-auto max-w-3xl">
        <AnimatePresence mode="wait">
          {/* Step 0 — Vehicle */}
          {step === 0 && (
            <motion.div key="v" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="grid gap-3 sm:grid-cols-2">
                {vehicles.map((v: VehicleResponse) => (
                  <button
                    key={v.id}
                    onClick={() => setVehicleId(v.id)}
                    className={`card relative flex items-center gap-4 p-5 text-left transition hover:border-brand-400 ${
                      vehicleId === v.id ? 'border-brand-500 ring-4 ring-brand-500/15' : ''
                    }`}
                  >
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-ink-100 dark:bg-ink-800">
                      {v.imageUrl ? (
                        <img src={assetUrl(v.imageUrl)} alt={`${v.make} ${v.model}`} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-ink-400 dark:text-ink-600">
                          <Car className="h-7 w-7" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-ink-900 dark:text-ink-100">{v.make} {v.model}</p>
                      <p className="mt-0.5 text-xs text-ink-400">{v.year} · {v.vehicleType} · {v.registrationNumber}</p>
                      {vehicleId === v.id && (
                        <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Selected
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 1 — Services (multi-select) */}
          {step === 1 && (
            <motion.div key="s" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-ink-900 dark:text-ink-100">What do you need?</h3>
                  <p className="mt-0.5 text-xs text-ink-500">Select one or more services — your estimate updates instantly.</p>
                </div>
                <span className="shrink-0 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
                  {selectedServices.length} {pluralize(selectedServices.length, 'service')} selected
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {serviceOptions.map((s) => {
                  const selected = selectedServices.includes(s.name);
                  return (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => toggleService(s.name)}
                      aria-pressed={selected}
                      className={`card flex items-start gap-3 p-5 text-left transition hover:border-brand-400 ${
                        selected ? 'border-brand-500 ring-4 ring-brand-500/15' : ''
                      }`}
                    >
                      <div
                        className={cn(
                          'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition',
                          selected
                            ? 'bg-brand-500 text-white'
                            : 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400'
                        )}
                      >
                        <Wrench className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-ink-900 dark:text-ink-100">{s.name}</p>
                        </div>
                        <p className="mt-0.5 text-xs text-ink-500">{s.desc}</p>
                        <p className="mt-1.5 text-sm font-bold text-brand-600 dark:text-brand-400">
                          {formatCurrency(s.price)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition',
                          selected
                            ? 'border-brand-500 bg-brand-500 text-white'
                            : 'border-ink-300 dark:border-ink-600'
                        )}
                      >
                        {selected && <Check className="h-3.5 w-3.5" />}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Add a service manually — validated against the platform catalogue */}
              <div className="mt-6 rounded-2xl border border-dashed border-ink-300 bg-ink-50/60 p-4 dark:border-ink-700 dark:bg-ink-800/40">
                <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-ink-800 dark:text-ink-200">
                  <Plus className="h-4 w-4 text-brand-500" /> Can't find it in the list?
                </p>
                <p className="mb-2 text-xs text-ink-500">
                  Type the service name to check availability &amp; price — only services from our catalogue can be booked.
                </p>
                <div className="flex gap-2">
                  <input
                    value={customService}
                    onChange={(e) => setCustomService(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomService(); } }}
                    placeholder="e.g. brake repair"
                    aria-label="Service name to look up"
                    className="input flex-1"
                  />
                  <Button onClick={addCustomService} disabled={!customService.trim()}>Check</Button>
                </div>
              </div>

              {/* Live estimate */}
              {estimatedAmount > 0 && (
                <div className="mt-6 overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white dark:border-brand-500/25 dark:from-brand-500/10 dark:to-ink-900">
                  <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
                    <div>
                      <p className="flex items-center gap-1.5 text-sm font-bold text-ink-900 dark:text-ink-100">
                        <IndianRupee className="h-4 w-4 text-brand-500" /> Estimated amount
                      </p>
                      <p className="mt-0.5 text-xs text-ink-500">
                        Starting estimate for your {pluralize(selectedServices.length, 'selection', 'selections')}
                      </p>
                    </div>
                    <p className="font-display text-2xl font-extrabold text-brand-600 dark:text-brand-400">
                      {formatCurrency(estimatedAmount)}
                    </p>
                  </div>
                  <div className="mt-3 space-y-1.5 border-t border-brand-500/15 px-5 py-4">
                    {serviceOptions
                      .filter((s) => selectedServices.includes(s.name))
                      .map((s) => (
                        <div key={s.name} className="flex items-center justify-between gap-3 text-xs">
                          <span className="flex min-w-0 items-center gap-1.5 text-ink-600 dark:text-ink-300">
                            <Check className="h-3 w-3 shrink-0 text-emerald-500" />
                            <span className="truncate">{s.name}</span>
                          </span>
                          <span className="shrink-0 font-semibold text-ink-900 dark:text-ink-100">{formatCurrency(s.price)}</span>
                        </div>
                      ))}
                  </div>
                  <div className="flex items-start gap-2 bg-amber-500/10 px-5 py-3">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                    <p className="text-[11px] font-medium leading-relaxed text-amber-700 dark:text-amber-300">
                      This is an estimate only — the final amount is confirmed after our mechanic inspects
                      your vehicle on-site and may change based on the actual condition.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 2 — Slot */}
          {step === 2 && (
            <motion.div key="t" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="card p-6">
                <div className="mb-2 flex items-center gap-2 text-ink-900 dark:text-ink-100">
                  <CalendarClock className="h-5 w-5 text-brand-500" />
                  <h3 className="font-bold">When do you need us?</h3>
                </div>
                <p className="mb-4 text-sm text-ink-500">Pick a convenient date &amp; time. Your chosen mechanic will confirm shortly.</p>
                <Input
                  id="scheduledAt"
                  label="Schedule"
                  type="datetime-local"
                  min={new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)}
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
              </div>
            </motion.div>
          )}

          {/* Step 3 — Address + interactive map */}
          {step === 3 && (
            <motion.div key="a" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="space-y-4">
                {/* Interactive map picker */}
                <LocationPicker
                  value={pickedLocation}
                  onChange={setPickedLocation}
                  height="350px"
                />

                {/* Address details */}
                <div className="card space-y-4 p-6">
                  <div className="flex items-center gap-2 text-ink-900 dark:text-ink-100">
                    <MapPin className="h-5 w-5 text-brand-500" />
                    <h3 className="font-bold">Service address</h3>
                  </div>

                  {location && !pickedLocation && (
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300">
                      <Crosshair className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      <span className="min-w-0 truncate">
                        GPS locked — <span className="font-mono">{location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setLocation(null)}
                        className="ml-auto shrink-0 rounded-full p-0.5 transition hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
                        aria-label="Clear GPS location"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  <Textarea
                    id="address"
                    label="Full address (house no, street, landmark, city)"
                    placeholder="e.g. 42 MG Road, Koramangala, Bangalore"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      setUserEditedAddress(true);
                    }}
                  />
                  <Input
                    id="skill"
                    label="Preferred mechanic skill (optional)"
                    placeholder="e.g. Engine Specialist"
                    value={preferredSkill}
                    onChange={(e) => setPreferredSkill(e.target.value)}
                  />
                  <p className="flex items-start gap-1.5 text-[11px] font-medium text-ink-400">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Click on the map or drag the pin to set your exact location. The GPS coordinates are sent with the booking so the mechanic can reach you precisely.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4 — Choose Mechanic */}
          {step === 4 && (
            <motion.div key="m" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-ink-900 dark:text-ink-100">
                  <UserCheck className="h-5 w-5 text-brand-500" />
                  <h3 className="font-bold">Choose your mechanic</h3>
                </div>
                {!location ? (
                  <Button variant="outline" size="sm" onClick={() => void captureLocation()} loading={locating}>
                    {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                    {locating ? 'Detecting…' : 'Filter by distance'}
                  </Button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
                    <Navigation className="h-3.5 w-3.5" /> Near {location.area}
                    <button
                      type="button"
                      onClick={() => setLocation(null)}
                      className="rounded-full p-0.5 transition hover:bg-brand-100 dark:hover:bg-brand-500/25"
                      aria-label="Clear location filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>

              {location && (
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-xs font-medium text-ink-400">Within</span>
                  {RADII.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRadius(r)}
                      className={cn(
                        'rounded-full px-3 py-1 text-xs font-semibold transition',
                        radius === r ? 'bg-brand-500 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300'
                      )}
                    >
                      {r} km
                    </button>
                  ))}
                </div>
              )}

              {loadingMechanics ? (
                <LoadingScreen label="Finding available mechanics…" />
              ) : mechanicsError ? (
                <ErrorState message="Could not load mechanics" onRetry={() => refetchMechanics()} />
              ) : visibleMechanics.length === 0 ? (
                <EmptyState
                  icon={<Wrench className="h-6 w-6" />}
                  title={location ? `No mechanics within ${radius} km` : 'No mechanics available'}
                  description={location ? 'Try a larger radius or clear the location filter.' : 'Please try again later — new mechanics join regularly.'}
                />
              ) : (
                <div className="grid gap-3">
                  {visibleMechanics.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMechanicId(m.id)}
                      className={`card flex items-start gap-4 p-4 text-left transition hover:border-brand-400 ${
                        mechanicId === m.id ? 'border-brand-500 ring-4 ring-brand-500/15' : ''
                      }`}
                    >
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl ring-2 ring-brand-500/20">
                        <img src={mechanicImageUrl(m.id)} alt={m.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-bold text-ink-900 dark:text-ink-100">{m.name}</p>
                          {mechanicId === m.id && <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-500" />}
                        </div>
                        <p className="mt-0.5 text-xs text-ink-400">📍 {m.serviceArea}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-500">
                          <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-400" /> {m.averageRating?.toFixed(1) ?? 'New'}</span>
                          <span>{m.totalJobsCompleted} jobs</span>
                          {m.distanceKm !== undefined ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
                              <Navigation className="h-3 w-3" /> {formatDistanceKm(m.distanceKm)}
                            </span>
                          ) : (
                            location && <span className="text-ink-400">distance n/a</span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Step 5 — Done */}
          {step === 5 && (
            <motion.div key="d" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="card flex flex-col items-center p-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-extrabold text-ink-900 dark:text-ink-100">Booking confirmed! 🎉</h2>
                <p className="mt-2 max-w-md text-sm text-ink-500">
                  {selectedServices.join(' + ')} booked for {user?.name}.
                  {selectedMechanic ? (
                    <> <span className="font-semibold text-ink-900 dark:text-ink-100">{selectedMechanic.name}</span> has been notified and will accept or decline your request.</>
                  ) : (
                    ' Track live updates from your bookings page.'
                  )}
                </p>
                {estimatedAmount > 0 && (
                  <div className="mt-5 flex items-center gap-2 rounded-2xl bg-brand-50 px-5 py-3 dark:bg-brand-500/10">
                    <IndianRupee className="h-5 w-5 text-brand-500" />
                    <div className="text-left">
                      <p className="text-xs text-ink-500">Estimated amount</p>
                      <p className="font-display text-lg font-extrabold text-brand-600 dark:text-brand-400">{formatCurrency(estimatedAmount)}</p>
                    </div>
                    <Info className="ml-2 h-4 w-4 text-amber-500" />
                    <p className="text-left text-[11px] font-medium text-ink-400">
                      Final amount confirmed after inspection
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-between">
          <Button variant="ghost" onClick={() => (step === 0 ? navigate('/dashboard') : setStep(step - 1))} disabled={step === 5}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          {step < 4 && (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext}>
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          {step === 4 && (
            <Button onClick={submit} loading={submitting} disabled={!canNext}>
              Confirm Booking
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
