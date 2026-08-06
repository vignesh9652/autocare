import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBooking } from '@/api/bookingApi';
import { getVehicles } from '@/api/vehicleApi';
import { getMechanic } from '@/api/mechanicApi';
import { getApiErrorMessage } from '@/api/client';
import { Button, Card, Input, Spinner, StatusBadge } from '@/components';
import { formatDateTime } from '@/utils/format';
import type { Booking, Mechanic, Vehicle } from '@/types';

const SERVICE_SUGGESTIONS = [
  'Oil Change',
  'Brake Repair',
  'Engine Service',
  'Suspension Repair',
  'Battery Replacement',
  'AC Service',
  'Tire Replacement',
  'General Service',
];

const SKILL_SUGGESTIONS = ['Engine', 'Brakes', 'Suspension', 'Electrical', 'AC', 'Transmission'];

const STEPS = ['Vehicle', 'Service', 'Schedule', 'Confirm'];

interface FormState {
  vehicleId: string;
  serviceType: string;
  preferredSkill: string;
  scheduledAt: string;
  address: string;
  serviceArea: string;
}

const EMPTY: FormState = {
  vehicleId: '',
  serviceType: '',
  preferredSkill: '',
  scheduledAt: '',
  address: '',
  serviceArea: '',
};

function isNoMechanicError(message: string): boolean {
  return /no available mechanic/i.test(message);
}

export default function NewBooking() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Success state
  const [created, setCreated] = useState<Booking | null>(null);
  const [mechanic, setMechanic] = useState<Mechanic | null | 'loading'>(null);

  const loadVehicles = useCallback(async () => {
    setVehiclesLoading(true);
    try {
      setVehicles(await getVehicles());
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load your vehicles'));
    } finally {
      setVehiclesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVehicles();
  }, [loadVehicles]);

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === Number(form.vehicleId)) ?? null,
    [vehicles, form.vehicleId],
  );

  const validateStep = (): string => {
    if (step === 1 && !form.vehicleId) return 'Please select a vehicle';
    if (step === 2 && !form.serviceType.trim()) return 'Please enter a service type';
    if (step === 3) {
      if (!form.scheduledAt) return 'Please pick a date and time';
      if (new Date(form.scheduledAt) <= new Date()) return 'Scheduled time must be in the future';
      if (!form.address.trim()) return 'Please enter a service address';
      if (!form.serviceArea.trim()) return 'Please enter a service area PIN code';
    }
    return '';
  };

  const next = () => {
    const message = validateStep();
    if (message) {
      setError(message);
      return;
    }
    setError('');
    setStep((s) => Math.min(4, s + 1));
  };

  const back = () => {
    setError('');
    setStep((s) => Math.max(1, s - 1));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const booking = await createBooking({
        vehicleId: Number(form.vehicleId),
        serviceType: form.serviceType.trim(),
        scheduledAt: form.scheduledAt,
        address: form.address.trim(),
        preferredSkill: form.preferredSkill.trim() || undefined,
        serviceArea: form.serviceArea.trim() || undefined,
      });
      setCreated(booking);
      // Show the auto-assigned mechanic's name.
      if (booking.mechanicId) {
        setMechanic('loading');
        try {
          setMechanic(await getMechanic(booking.mechanicId));
        } catch {
          setMechanic(null);
        }
      } else {
        setMechanic(null);
      }
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to create booking');
      // No mechanic matched — send the user back to step 3 to adjust and retry.
      if (isNoMechanicError(message)) {
        setError('No available mechanic found matching your criteria — try a different time, skill, or area.');
        setStep(3);
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* ------------------------------ Success ------------------------------ */
  if (created) {
    return (
      <div className="container-page flex justify-center py-16">
        <Card className="w-full max-w-lg p-8 text-center">
          <p className="text-5xl" aria-hidden>🎉</p>
          <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">Booking Confirmed!</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Booking <span className="font-semibold text-slate-800 dark:text-slate-200">#{created.id}</span> ·{' '}
            {created.serviceType}
          </p>

          <div className="mt-6 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-900/50 p-4 text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-slate-500">Your mechanic</span>
              <StatusBadge status={created.status} />
            </div>
            {mechanic === 'loading' ? (
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Spinner size="sm" /> Fetching mechanic…
              </div>
            ) : mechanic ? (
              <div className="mt-2 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600/20 font-bold text-brand-600 dark:text-brand-300">
                  {mechanic.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{mechanic.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {mechanic.skills.join(', ')} · {mechanic.serviceArea}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                A mechanic will be assigned to your booking shortly.
              </p>
            )}
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Scheduled for {formatDateTime(created.scheduledAt)}
          </p>

          <div className="mt-6 flex gap-3">
            <Button className="flex-1" onClick={() => navigate(`/bookings/${created.id}`)}>
              View Booking
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => navigate('/bookings')}>
              All Bookings
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  /* ------------------------------ Wizard ------------------------------- */
  return (
    <div className="container-page flex justify-center py-10">
      <Card className="w-full max-w-xl p-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">New Booking</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Schedule a repair — we assign the right mechanic</p>

        {/* Step indicator */}
        <ol className="mt-6 flex items-center gap-2">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const active = n === step;
            const done = n < step;
            return (
              <li key={label} className="flex flex-1 items-center gap-2">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    done
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                      : active
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {done ? '✓' : n}
                </span>
                <span className={`hidden text-xs sm:block ${active ? 'font-semibold text-slate-800 dark:text-slate-200' : 'text-slate-500'}`}>
                  {label}
                </span>
                {n < STEPS.length && <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" aria-hidden />}
              </li>
            );
          })}
        </ol>

        {error && (
          <div
            role="alert"
            className={`mt-5 rounded-lg border px-4 py-3 text-sm ${
              isNoMechanicError(error)
                ? 'border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'
                : 'border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400'
            }`}
          >
            {error}
          </div>
        )}

        <div className="mt-6">
          {step === 1 && (
            <div>
              <label className="label" htmlFor="nb-vehicle">Select your vehicle</label>
              {vehiclesLoading ? (
                <Spinner size="sm" className="py-6" />
              ) : vehicles.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-6 text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">You need at least one vehicle to book.</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-3"
                    onClick={() => navigate('/vehicles/new')}
                  >
                    + Add a vehicle
                  </Button>
                </div>
              ) : (
                <select
                  id="nb-vehicle"
                  className="input"
                  value={form.vehicleId}
                  onChange={(e) => setForm((f) => ({ ...f, vehicleId: e.target.value }))}
                >
                  <option value="">Choose a vehicle…</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.make} {v.model} ({v.year}) · {v.registrationNumber}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="label" htmlFor="nb-service">Service type</label>
                <input
                  id="nb-service"
                  className="input"
                  list="service-suggestions"
                  required
                  value={form.serviceType}
                  onChange={(e) => setForm((f) => ({ ...f, serviceType: e.target.value }))}
                  placeholder="e.g. Brake Repair"
                />
                <datalist id="service-suggestions">
                  {SERVICE_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
                </datalist>
              </div>
              <div>
                <label className="label" htmlFor="nb-skill">
                  Required skill <span className="text-slate-600">(recommended)</span>
                </label>
                <input
                  id="nb-skill"
                  className="input"
                  list="skill-suggestions"
                  value={form.preferredSkill}
                  onChange={(e) => setForm((f) => ({ ...f, preferredSkill: e.target.value }))}
                  placeholder="e.g. Brakes"
                />
                <datalist id="skill-suggestions">
                  {SKILL_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
                </datalist>
                <p className="mt-1 text-xs text-slate-500">
                  We'll only assign a mechanic who has this skill.
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <Input
                label="Date & time"
                type="datetime-local"
                required
                value={form.scheduledAt}
                onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
              />
              <Input
                label="Service address"
                required
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Flat, street, city"
              />
              <Input
                label="Service area PIN code"
                required
                value={form.serviceArea}
                onChange={(e) => setForm((f) => ({ ...f, serviceArea: e.target.value }))}
                placeholder="560001"
                hint="Only mechanics servicing this area will be considered"
              />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Review your booking
              </h2>
              <div className="rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-900/50 p-4">
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Vehicle</dt>
                    <dd className="font-medium text-slate-800 dark:text-slate-200">
                      {selectedVehicle
                        ? `${selectedVehicle.make} ${selectedVehicle.model} · ${selectedVehicle.registrationNumber}`
                        : `#${form.vehicleId}`}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Service</dt>
                    <dd className="font-medium text-slate-800 dark:text-slate-200">{form.serviceType}</dd>
                  </div>
                  {form.preferredSkill && (
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Required skill</dt>
                      <dd className="font-medium text-slate-800 dark:text-slate-200">{form.preferredSkill}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Scheduled</dt>
                    <dd className="font-medium text-slate-800 dark:text-slate-200">{formatDateTime(form.scheduledAt)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Address</dt>
                    <dd className="max-w-[60%] text-right font-medium text-slate-800 dark:text-slate-200">{form.address}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Area PIN</dt>
                    <dd className="font-medium text-slate-800 dark:text-slate-200">{form.serviceArea}</dd>
                  </div>
                </dl>
              </div>
              <p className="text-xs text-slate-500">
                On confirmation, an available mechanic matching your skill and area is assigned
                automatically.
              </p>
            </div>
          )}
        </div>

        {/* Nav buttons */}
        <div className="mt-8 flex items-center justify-between gap-3">
          {step > 1 ? (
            <Button variant="ghost" onClick={back}>← Back</Button>
          ) : (
            <Button variant="ghost" onClick={() => navigate('/bookings')}>Cancel</Button>
          )}
          {step < 4 ? (
            <Button onClick={next} disabled={step === 1 && vehicles.length === 0}>
              Continue →
            </Button>
          ) : (
            <Button onClick={handleSubmit} loading={submitting}>
              {submitting ? 'Creating…' : 'Confirm Booking'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
