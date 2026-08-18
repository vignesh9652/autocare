import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Car,
  Check,
  CheckCircle2,
  Crosshair,
  IndianRupee,
  Info,
  Loader2,
  LocateFixed,
  MapPin,
  Navigation,
  Star,
  UserCheck,
  Wrench,
  X,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { bookingApi, getErrorMessage, mechanicApi, partsApi, serviceApi, vehicleApi } from '@/lib/api';
import { assetUrl, partImageUrl } from '@/lib/images';
import { isGeolocationSupported, detectLiveLocation, haversineKm, formatDistanceKm } from '@/lib/geolocation';
import { LocationPicker, PickedLocation } from '@/components/ui/LocationPicker';
import { toast } from '@/stores/toast-store';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Stepper } from '@/components/ui/Stepper';
import { EmptyState, ErrorState, LoadingScreen } from '@/components/ui/Feedback';
import { cn, formatCurrency } from '@/lib/utils';
import { MechanicResponse, VehicleResponse } from '@/types';

const STEPS = ['Vehicle', 'Slot', 'Location', 'Mechanic', 'Done'];
const RADII = [5, 10, 25, 50];

interface CustomerLocation {
  latitude: number;
  longitude: number;
  area: string;
  accuracy?: number;
}

interface MechanicWithDistance extends MechanicResponse {
  distanceKm?: number;
}

export function BookInstallationScreen() {
  const { id } = useParams<{ id: string }>();
  const sparePartId = Number(id);
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [vehicleId, setVehicleId] = useState<number | ''>('');
  const [scheduledAt, setScheduledAt] = useState<string>('');
  const [address, setAddress] = useState('');
  const [pickedLocation, setPickedLocation] = useState<PickedLocation | null>(null);
  const [userEditedAddress, setUserEditedAddress] = useState(false);
  const [locating, setLocating] = useState(false);
  const [location, setLocation] = useState<CustomerLocation | null>(null);
  const [radius, setRadius] = useState(25);
  const [mechanicId, setMechanicId] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);

  const { data: part } = useQuery({
    queryKey: ['part', id],
    queryFn: () => partsApi.get(sparePartId),
    enabled: !!id,
  });

  const { data: vehicles, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-vehicles'],
    queryFn: vehicleApi.getMyVehicles,
  });

  const { data: mechanics, isLoading: loadingMechanics, isError: mechanicsError, refetch: refetchMechanics } = useQuery({
    queryKey: ['available-mechanics'],
    queryFn: () => mechanicApi.getAll({ available: true }),
  });

  const { data: feeConfig } = useQuery({
    queryKey: ['installation-fee'],
    queryFn: serviceApi.getInstallationFee,
  });
  const installationFee = feeConfig?.installationFee ?? 300;

  const selectedMechanic = useMemo<MechanicWithDistance | undefined>(
    () => (mechanics ?? []).find((m) => m.id === mechanicId),
    [mechanics, mechanicId]
  );

  const canNext = useMemo(() => {
    if (step === 0) return vehicleId !== '';
    if (step === 1) return !!scheduledAt;
    if (step === 2) return !!(pickedLocation || location) || address.trim().length >= 8;
    if (step === 3) return mechanicId !== '';
    return false;
  }, [step, vehicleId, scheduledAt, address, pickedLocation, location, mechanicId]);

  // Auto-fill address from map reverse geocode (only when user hasn't manually typed)
  useEffect(() => {
    if (pickedLocation?.area && !userEditedAddress) {
      setAddress(pickedLocation.area);
    }
  }, [pickedLocation, userEditedAddress]);

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
      await bookingApi.createInstallation({
        vehicleId: vehicleId as number,
        sparePartId,
        scheduledAt: new Date(scheduledAt).toISOString(),
        address: pickedLocation ? (address || pickedLocation.area) : address,
        latitude: finalLocation?.latitude,
        longitude: finalLocation?.longitude,
        mechanicId: mechanicId as number,
        preferredSkill: 'Spare Part Installation',
        serviceArea: 'Spare Part Installation',
      });
      toast(`Installation booked! ${selectedMechanic ? selectedMechanic.name : 'Your mechanic'} will confirm shortly.`, 'success');
      setStep(4);
      setTimeout(() => navigate('/dashboard/installations'), 1800);
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
          description="You need at least one vehicle before booking an installation."
          action={<Link to="/dashboard/vehicles"><Button>Add My Vehicle</Button></Link>}
        />
      </div>
    );
  }

  return (
    <div className="container-app py-10">
      <Link to={`/parts/${sparePartId}`} className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Back to {part?.name ?? 'part'}
      </Link>

      {/* Summary strip */}
      <div className="mb-8 flex flex-wrap items-center gap-4 rounded-2xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
        <img src={partImageUrl(part?.category ?? 'parts', part?.imageUrl)} alt={part?.name ?? ''} className="h-14 w-14 rounded-xl object-cover" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-ink-900 dark:text-ink-100">{part?.name ?? 'Spare part'} — Installation</p>
          <p className="text-xs text-ink-400">Professional doorstep installation by a verified AutoCare mechanic</p>
        </div>
        <div className="rounded-xl bg-brand-50 px-4 py-2 text-right dark:bg-brand-500/15">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">Installation fee</p>
          <p className="font-display text-lg font-extrabold text-brand-600 dark:text-brand-400">{formatCurrency(installationFee)}</p>
        </div>
      </div>

      <Stepper steps={STEPS} current={step} />

      <div className="mx-auto max-w-3xl">
        <AnimatePresence mode="wait">
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

          {step === 1 && (
            <motion.div key="t" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="card p-6">
                <div className="mb-2 flex items-center gap-2 text-ink-900 dark:text-ink-100">
                  <CalendarClock className="h-5 w-5 text-brand-500" />
                  <h3 className="font-bold">When should the mechanic arrive?</h3>
                </div>
                <p className="mb-4 text-sm text-ink-500">Pick a convenient date &amp; time. The chosen mechanic confirms shortly.</p>
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

          {step === 2 && (
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
                    <h3 className="font-bold">Installation address</h3>
                  </div>

                  {location && !pickedLocation && (
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300">
                      <Crosshair className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      <span className="min-w-0 truncate">
                        GPS locked — <span className="font-mono">{location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</span>
                      </span>
                      <button type="button" onClick={() => setLocation(null)} className="ml-auto shrink-0 rounded-full p-0.5 transition hover:bg-emerald-100 dark:hover:bg-emerald-500/20" aria-label="Clear GPS location">
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
                  <p className="flex items-start gap-1.5 text-[11px] font-medium text-ink-400">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Click on the map or drag the pin to set your exact location. The mechanic brings the tools and installs the part at this address.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
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
                    <button type="button" onClick={() => setLocation(null)} className="rounded-full p-0.5 transition hover:bg-brand-100 dark:hover:bg-brand-500/25" aria-label="Clear location filter">
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
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-bold text-ink-900 dark:text-ink-100">{m.name}</p>
                          {mechanicId === m.id && <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-500" />}
                        </div>
                        <p className="mt-0.5 text-xs text-ink-400">📍 {m.serviceArea}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-500">
                          <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-400" /> {m.averageRating?.toFixed(1) ?? 'New'}</span>
                          <span>{m.totalJobsCompleted} jobs</span>
                          {m.distanceKm !== undefined && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
                              <Navigation className="h-3 w-3" /> {formatDistanceKm(m.distanceKm)}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="d" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="card flex flex-col items-center p-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-extrabold text-ink-900 dark:text-ink-100">Installation booked! 🎉</h2>
                <p className="mt-2 max-w-md text-sm text-ink-500">
                  {part?.name} installation scheduled{selectedMechanic ? <> with <span className="font-semibold text-ink-900 dark:text-ink-100">{selectedMechanic.name}</span></> : ''}.
                  Track it live from your installations page.
                </p>
                <div className="mt-5 flex items-center gap-2 rounded-2xl bg-brand-50 px-5 py-3 dark:bg-brand-500/10">
                  <IndianRupee className="h-5 w-5 text-brand-500" />
                  <div className="text-left">
                    <p className="text-xs text-ink-500">Installation fee</p>
                    <p className="font-display text-lg font-extrabold text-brand-600 dark:text-brand-400">{formatCurrency(installationFee)}</p>
                  </div>
                  <Info className="ml-2 h-4 w-4 text-amber-500" />
                  <p className="text-left text-[11px] font-medium text-ink-400">
                    Pay after the installation is completed
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-between">
          <Button variant="ghost" onClick={() => (step === 0 ? navigate(-1) : setStep(step - 1))} disabled={step === 4}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          {step < 3 && (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext}>
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          {step === 3 && (
            <Button onClick={submit} loading={submitting} disabled={!canNext}>
              <Check className="h-4 w-4" /> Confirm Installation Booking
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
