import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, Eye, EyeOff, LocateFixed, Loader2, MapPin } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { detectLiveLocation } from '@/lib/geolocation';
import { u } from '@/lib/images';
import { getErrorMessage } from '@/lib/api';
import { toast } from '@/stores/toast-store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthShell } from './AuthShell';

const schema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    // Normalize at the schema level so validation runs on the trimmed/lowercased
    // value — matches LoginScreen and keeps stored emails consistent, otherwise
    // a pasted email with a trailing space would fail the .email() check and an
    // uppercase address would be un-findable at login (backend lookup is
    // case-sensitive).
    email: z.string().trim().toLowerCase().email('Enter a valid email'),
    // Optional, but when present must be a valid Indian mobile number
    // (10 digits starting 6-9, optional +91 prefix / 5-5 separator).
    // Normalized to a clean 10-digit format before storing.
    phone: z
      .string()
      .trim()
      .optional()
      .refine((v) => !v || /^(?:\+?91[-\s]?)?[6-9]\d{4}[-\s]?\d{5}$/.test(v), 'Enter a valid 10-digit Indian mobile number')
      .transform((v) => (v ? v.replace(/\D/g, '').slice(-10) : v)),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

type FormValues = z.infer<typeof schema>;

export function RegisterScreen() {
  const registerFn = useAuthStore((s) => s.register);
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [locating, setLocating] = useState(false);
  const [location, setLocation] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const handleLocation = async () => {
    setLocating(true);
    try {
      const loc = await detectLiveLocation();
      setLocation(loc.area);
      toast(`Location detected: ${loc.area}`, 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not detect location', 'error');
    } finally {
      setLocating(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      await registerFn(values.name, values.email, values.password, values.phone ?? '');
      toast('Account created! Welcome to AutoCare.', 'success');
      navigate('/dashboard');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Book trusted mechanics in minutes">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Full Name" id="name" placeholder="John Doe" autoComplete="name"
          error={errors.name?.message} {...register('name')} />
        <Input label="Email" id="email" type="email" placeholder="you@example.com" autoComplete="email"
          error={errors.email?.message} {...register('email')} />
        {/* Relevant image banner */}
        <div className="relative mb-1 h-24 overflow-hidden rounded-2xl">
          <img
            src={u('photo-1487754180451-c456f719a1fc')}
            alt="Vehicle being serviced"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-950/80 to-transparent" />
          <p className="absolute bottom-3 left-4 text-xs font-semibold text-white">Doorstep repair &amp; genuine parts.</p>
        </div>

        <Input label="Phone (optional)" id="phone" type="tel" placeholder="+91 98765 43210" autoComplete="tel"
          error={errors.phone?.message} {...register('phone')} />

        {/* Live location */}
        <div>
          <button
            type="button"
            onClick={() => void handleLocation()}
            disabled={locating}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink-200 px-4 py-2.5 text-sm font-semibold text-ink-600 transition hover:border-brand-400 hover:text-brand-600 disabled:opacity-60 dark:border-ink-700 dark:text-ink-300"
          >
            {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
            {locating ? 'Detecting your location…' : 'Detect my current location'}
          </button>
          {location && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <MapPin className="h-3.5 w-3.5" /> {location}
            </p>
          )}
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <div className="relative">
            <input id="password" type={showPw ? 'text' : 'password'} placeholder="Min. 6 characters"
              className="input pr-10" autoComplete="new-password" {...register('password')} />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>}
        </div>
        <Input label="Confirm Password" id="confirmPassword" type="password" placeholder="Repeat your password"
          autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />

        <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
          <UserPlus className="h-5 w-5" /> Create Account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">Sign in</Link>
      </p>
    </AuthShell>
  );
}
