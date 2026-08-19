import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, Wrench, MapPin, LocateFixed, Loader2, X, Plus } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { mechanicApi, getErrorMessage } from '@/lib/api';
import { detectLiveLocation } from '@/lib/geolocation';
import { MECHANIC_REGISTER_BG } from '@/lib/images';
import { toast } from '@/stores/toast-store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthShell } from './AuthShell';
import { cn } from '@/lib/utils';

const PRESET_SKILLS = ['Oil Change', 'Brake Repair', 'Engine Service', 'AC Repair', 'Tire Change', 'Battery Check', 'Transmission', 'Electrical', 'Body Work'];

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  // Normalize at the schema level so validation runs on the trimmed/lowercased
  // value — matches LoginScreen and keeps stored emails consistent.
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  // Required Indian mobile number (10 digits starting 6-9, optional +91 prefix / 5-5 separator).
  // Normalized to a clean 10-digit format before storing.
  phone: z
    .string()
    .trim()
    .regex(/^(?:\+?91[-\s]?)?[6-9]\d{4}[-\s]?\d{5}$/, 'Enter a valid 10-digit Indian mobile number')
    .transform((v) => v.replace(/\D/g, '').slice(-10)),
  password: z.string().min(6, 'At least 6 characters'),
  serviceArea: z.string().min(2, 'Service area is required'),
});

type FormValues = z.infer<typeof schema>;

export function RegisterMechanicScreen() {
  const registerFn = useAuthStore((s) => s.register);
  const [skills, setSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState('');
  const [skillsTouched, setSkillsTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [locating, setLocating] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const toggleSkill = (skill: string) => {
    setSkillsTouched(true);
    setSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]));
  };

  const addCustomSkill = () => {
    const skill = customSkill.trim();
    if (!skill) return;
    setSkillsTouched(true);
    setSkills((prev) => (prev.some((s) => s.toLowerCase() === skill.toLowerCase()) ? prev : [...prev, skill]));
    setCustomSkill('');
  };

  const handleLocation = async () => {
    setLocating(true);
    try {
      const loc = await detectLiveLocation();
      setValue('serviceArea', loc.area, { shouldValidate: true });
      setLocation({ latitude: loc.latitude, longitude: loc.longitude });
      toast(`Location detected: ${loc.area}`, 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not detect location', 'error');
    } finally {
      setLocating(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (skills.length === 0) {
      setSkillsTouched(true);
      toast('Add at least one skill', 'warning');
      return;
    }
    try {
      await registerFn(values.name, values.email, values.password, values.phone, 'MECHANIC');
      await mechanicApi.create({
        name: values.name,
        phone: values.phone,
        email: values.email,
        skills,
        serviceArea: values.serviceArea,
        latitude: location?.latitude,
        longitude: location?.longitude,
      });
      // Mechanic accounts start PENDING; clear session so login gate applies
      useAuthStore.getState().logout();
      setSubmitted(true);
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50 p-6 dark:bg-ink-950">
        <div className="w-full max-w-md animate-fade-in rounded-3xl bg-white p-10 text-center shadow-card-lg dark:bg-ink-900">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-100 text-amber-600">
            <Wrench className="h-10 w-10" />
          </div>
          <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-white">Application Submitted!</h2>
          <p className="mt-3 text-sm text-ink-500">
            Your mechanic application is pending admin approval. You'll be able to sign in and accept jobs once approved.
          </p>
          <Link to="/login" className="mt-8 inline-block"><Button>Go to Sign In</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <AuthShell title="Apply as a Mechanic" subtitle="Join our network and grow your business" bgImage={MECHANIC_REGISTER_BG}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Full Name" id="name" placeholder="John Doe" error={errors.name?.message} {...register('name')} />
        <Input label="Email" id="email" type="email" placeholder="mechanic@example.com" error={errors.email?.message} {...register('email')} />
        <Input label="Phone" id="phone" type="tel" placeholder="+91 98765 43210" error={errors.phone?.message} {...register('phone')} />
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" placeholder="Min. 6 characters" className="input" {...register('password')} />
          {errors.password && <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>}
        </div>

        {/* Service area + live location */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="label mb-0" htmlFor="serviceArea">Service Area</label>
            <button
              type="button"
              onClick={() => void handleLocation()}
              disabled={locating}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 transition hover:bg-brand-100 disabled:opacity-60 dark:bg-brand-500/15 dark:text-brand-400 dark:hover:bg-brand-500/25"
            >
              {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LocateFixed className="h-3.5 w-3.5" />}
              {locating ? 'Detecting…' : 'Detect my location'}
            </button>
          </div>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              id="serviceArea"
              placeholder="e.g. Downtown, Brooklyn"
              className={cn('input pl-9', errors.serviceArea && 'border-red-400')}
              {...register('serviceArea')}
            />
          </div>
          {errors.serviceArea && <p className="mt-1.5 text-xs text-red-600">{errors.serviceArea.message}</p>}
          {location && (
            <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <MapPin className="h-3.5 w-3.5" /> Live location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </p>
          )}
        </div>

        {/* Skills — preset chips + manual add */}
        <div>
          <label className="label">Skills</label>
          <div className="flex flex-wrap gap-2">
            {PRESET_SKILLS.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => toggleSkill(skill)}
                className={cn(
                  'rounded-xl border px-3 py-1.5 text-xs font-medium transition',
                  skills.includes(skill)
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400'
                    : 'border-ink-200 text-ink-600 hover:border-ink-300 dark:border-ink-700 dark:text-ink-300'
                )}
              >
                {skill}
              </button>
            ))}
          </div>

          {/* Manually added skills — shown as removable badges */}
          {skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  {skill}
                  <button type="button" onClick={() => toggleSkill(skill)} className="opacity-80 transition hover:opacity-100" aria-label={`Remove ${skill}`}>
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Manual skill input */}
          <div className="mt-3 flex gap-2">
            <div className="relative flex-1">
              <Wrench className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                id="custom-skill"
                className="input pl-9"
                placeholder="Type a custom skill (e.g. Detailing, Paint)…"
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomSkill();
                  }
                }}
              />
            </div>
            <Button type="button" variant="secondary" onClick={addCustomSkill} disabled={!customSkill.trim()}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>

          {skillsTouched && skills.length === 0 && (
            <p className="mt-1.5 text-xs text-red-600">Add at least one skill</p>
          )}
        </div>

        <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
          <UserPlus className="h-5 w-5" /> Submit Application
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Already registered?{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">Sign in</Link>
      </p>
    </AuthShell>
  );
}
