import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Crosshair, Loader2, MapPin, ShieldCheck, Wrench } from 'lucide-react';
import { getApiErrorMessage } from '@/api/client';
import { registerUser } from '@/api/authApi';
import { createMechanic, updateAvailability } from '@/api/mechanicApi';
import { clearAuthStorage, setToken } from '@/api/client';
import { Button, Card, Input } from '@/components';
import { cn } from '@/utils/cn';

interface FormState {
  name: string;
  email: string;
  phone: string;
  password: string;
  skills: string[];
  serviceArea: string;
  latitude: string;
  longitude: string;
}

type FormErrors = Partial<Record<'name' | 'email' | 'phone' | 'password' | 'skills' | 'serviceArea' | 'location', string>>;

const SKILL_OPTIONS = [
  'Oil Change',
  'Brake Repair',
  'Engine Diagnostics',
  'AC Service',
  'Battery Replacement',
  'Wheel Alignment',
  'Transmission Service',
  'Denting & Painting',
  'Car Detailing',
  'EV Service',
  'General Inspection',
];

const AREA_OPTIONS = [
  'Koramangala',
  'Indiranagar',
  'Whitefield',
  'HSR Layout',
  'Electronic City',
  'Jayanagar',
  'Marathahalli',
  'Hebbal',
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9\s()-]{7,15}$/;

const PENDING_NOTE =
  'Note: Mechanic accounts require Admin approval before login. Your account will remain in Pending status until approved by the AutoCare Administrator.';

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.name.trim()) errors.name = 'Full name is required';
  else if (form.name.trim().length < 2) errors.name = 'Name must be at least 2 characters';

  if (!form.email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_RE.test(form.email.trim())) errors.email = 'Enter a valid email address';

  if (form.phone.trim() && !PHONE_RE.test(form.phone.trim())) {
    errors.phone = 'Enter a valid phone number';
  }

  if (!form.password) errors.password = 'Password is required';
  else if (form.password.length < 8) errors.password = 'Password must be at least 8 characters';

  if (form.skills.length === 0) errors.skills = 'Select at least one skill';
  if (!form.serviceArea) errors.serviceArea = 'Choose your service area';

  const lat = form.latitude.trim();
  const lng = form.longitude.trim();
  if (lat || lng) {
    const latNum = Number(lat);
    const lngNum = Number(lng);
    if (!lat || !lng || Number.isNaN(latNum) || Number.isNaN(lngNum) || latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      errors.location = 'Enter valid coordinates (lat -90..90, lng -180..180)';
    }
  }

  return errors;
}

export default function RegisterMechanicPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    phone: '',
    password: '',
    skills: [],
    serviceArea: '',
    latitude: '',
    longitude: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [profileWarning, setProfileWarning] = useState('');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((prev) => (prev[name as keyof FormErrors] ? { ...prev, [name]: undefined } : prev));
  };

  const toggleSkill = (skill: string) => {
    setForm((f) => ({
      ...f,
      skills: f.skills.includes(skill) ? f.skills.filter((s) => s !== skill) : [...f.skills, skill],
    }));
    setErrors((prev) => (prev.skills ? { ...prev, skills: undefined } : prev));
  };

  const useMyLocation = () => {
    setLocationError('');
    if (!('geolocation' in navigator)) {
      setLocationError('Geolocation is not supported by this browser — enter coordinates manually.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setErrors((prev) => (prev.location ? { ...prev, location: undefined } : prev));
        setLocating(false);
      },
      () => {
        setLocationError('Could not fetch your location — enter coordinates manually.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setIsSubmitting(true);
    try {
      // Step 1: create the MECHANIC user account (status = PENDING on backend).
      const auth = await registerUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
        role: 'MECHANIC',
      });

      // Step 2: create the public mechanic profile with the registration token.
      setToken(auth.token);
      try {
        const profile = await createMechanic({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || '0000000000',
          skills: form.skills,
          serviceArea: form.serviceArea,
          latitude: form.latitude.trim() ? Number(form.latitude) : null,
          longitude: form.longitude.trim() ? Number(form.longitude) : null,
        });
        // Stay offline until the admin approves the account.
        await updateAvailability(profile.id, { availabilityStatus: 'OFFLINE' });
      } catch {
        setProfileWarning(
          'Your account was created, but we could not save your profile details automatically. Contact support once your application is approved.',
        );
      } finally {
        clearAuthStorage();
      }

      setSubmitted(true);
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, 'Registration failed. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
        <Card className="w-full max-w-lg p-8 text-center animate-slide-up">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 dark:bg-emerald-500/15">
            <CheckCircle2 className="h-9 w-9" />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-slate-100">Application submitted! 🎉</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Your mechanic account has been created and is now <span className="font-semibold text-amber-600 dark:text-amber-400">Pending</span> admin
            approval. You will be able to sign in as soon as the AutoCare Administrator approves your registration.
          </p>

          {profileWarning && (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-left text-sm text-amber-700 dark:text-amber-400"
            >
              {profileWarning}
            </div>
          )}

          <div className="mt-6 flex flex-col items-center gap-2">
            <Button onClick={() => navigate('/login')} className="w-full sm:w-auto">
              Back to Sign In
            </Button>
            <Link to="/" className="text-xs text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400">
              Return to home
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <Card className="w-full max-w-2xl p-8 animate-slide-up">
        <div className="mb-6 text-center">
          <span className="text-3xl" aria-hidden>🔧</span>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">Become an AutoCare Mechanic</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Join the network — customers in your area will be able to find and book you
          </p>
        </div>

        <div
          role="note"
          className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
        >
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{PENDING_NOTE}</p>
        </div>

        {submitError && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400"
          >
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Full Name"
              name="name"
              required
              autoComplete="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Jane Doe"
              error={errors.name}
            />
            <Input
              label="Email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              error={errors.email}
            />
            <Input
              label="Phone"
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="9876543210"
              error={errors.phone}
            />
            <Input
              label="Password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              placeholder="At least 8 characters"
              hint="Minimum 8 characters"
              error={errors.password}
            />
          </div>

          {/* Skills */}
          <div className="mt-5">
            <label className="label">Your Skills</label>
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map((skill) => {
                const active = form.skills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={cn(
                      'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all',
                      active
                        ? 'border-transparent bg-gradient-to-r from-brand-600 to-sky-500 text-white shadow-md shadow-brand-600/20'
                        : 'border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-brand-500/50 dark:hover:text-brand-400',
                    )}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>
            {errors.skills && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.skills}</p>}
          </div>

          {/* Service area */}
          <div className="mt-5">
            <label className="label">Service Area</label>
            <select
              className="select"
              value={form.serviceArea}
              onChange={(e) => {
                setForm((f) => ({ ...f, serviceArea: e.target.value }));
                setErrors((prev) => (prev.serviceArea ? { ...prev, serviceArea: undefined } : prev));
              }}
            >
              <option value="">Choose your area…</option>
              {AREA_OPTIONS.map((area) => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
            {errors.serviceArea && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.serviceArea}</p>}
          </div>

          {/* Workshop location */}
          <div className="mt-5 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Workshop location (optional)</p>
              </div>
              <button
                type="button"
                onClick={useMyLocation}
                disabled={locating}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-600 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:border-brand-500/50 dark:hover:text-brand-400"
              >
                {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Crosshair className="h-3.5 w-3.5" />}
                {locating ? 'Locating…' : 'Use my location'}
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Input
                label="Latitude"
                name="latitude"
                type="number"
                step="any"
                value={form.latitude}
                onChange={handleChange}
                placeholder="12.9352"
              />
              <Input
                label="Longitude"
                name="longitude"
                type="number"
                step="any"
                value={form.longitude}
                onChange={handleChange}
                placeholder="77.6245"
              />
            </div>
            {(errors.location || locationError) && (
              <p className="mt-2 text-xs font-medium text-red-500">{errors.location ?? locationError}</p>
            )}
            <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
              <Wrench className="h-3 w-3" /> Your workshop coordinates power the customer "nearby mechanics" search.
            </p>
          </div>

          <Button type="submit" loading={isSubmitting} className="mt-6 w-full">
            {isSubmitting ? 'Submitting application…' : 'Apply as a Mechanic'}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
          Registering as a customer instead?{' '}
          <Link to="/register" className="font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-600 dark:hover:text-brand-300">
            Create a customer account
          </Link>
        </p>
      </Card>
    </div>
  );
}
