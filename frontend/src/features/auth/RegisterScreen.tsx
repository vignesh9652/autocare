import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  UserPlus, Eye, EyeOff, LocateFixed, Loader2, MapPin,
  ShieldCheck, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/auth-store';
import { detectLiveLocation } from '@/lib/geolocation';
import { getErrorMessage } from '@/lib/api';
import { toast } from '@/stores/toast-store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthShell } from './AuthShell';

const schema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().trim().toLowerCase().email('Enter a valid email'),
    phone: z
      .string()
      .trim()
      .optional()
      .refine(
        (v) => !v || /^(?:\+?91[-\s]?)?[6-9]\d{4}[-\s]?\d{5}$/.test(v),
        'Enter a valid 10-digit Indian mobile number',
      )
      .transform((v) => (v ? v.replace(/\D/g, '').slice(-10) : v)),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

/* ── Password strength helpers ─────────────────────────────────────────────── */

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score <= 2) return { score, label: 'Fair', color: 'bg-orange-500' };
  if (score <= 3) return { score, label: 'Good', color: 'bg-amber-500' };
  if (score <= 4) return { score, label: 'Strong', color: 'bg-emerald-500' };
  return { score, label: 'Very strong', color: 'bg-emerald-400' };
}

/* ── Trust badges ──────────────────────────────────────────────────────────── */

const trustBadges = [
  { icon: ShieldCheck, text: 'Bank-level encryption' },
  { icon: CheckCircle2, text: 'Free forever — no credit card' },
  { icon: MapPin, text: 'Doorstep service across India' },
];

/* ── Component ─────────────────────────────────────────────────────────────── */

export function RegisterScreen() {
  const registerFn = useAuthStore((s) => s.register);
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [locating, setLocating] = useState(false);
  const [location, setLocation] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const watchedPassword = watch('password', '');
  const strength = useMemo(() => passwordStrength(watchedPassword), [watchedPassword]);

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
        {/* ── Name & Email ────────────────────────────────────────────────── */}
        <Input
          label="Full Name"
          id="name"
          placeholder="John Doe"
          autoComplete="name"
          error={errors.name?.message}
          {...register('name')}
        />
        <Input
          label="Email"
          id="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />

        {/* ── Phone ───────────────────────────────────────────────────────── */}
        <Input
          label="Phone (optional)"
          id="phone"
          type="tel"
          placeholder="+91 98765 43210"
          autoComplete="tel"
          error={errors.phone?.message}
          {...register('phone')}
        />

        {/* ── Location detection — card style ─────────────────────────────── */}
        <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50/60 p-3 transition-colors hover:border-brand-300 dark:border-ink-700 dark:bg-ink-900/50 dark:hover:border-brand-500/50">
          <button
            type="button"
            onClick={() => void handleLocation()}
            disabled={locating}
            className="flex w-full items-center gap-3 text-left"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
              {locating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LocateFixed className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink-700 dark:text-ink-200">
                {locating ? 'Detecting your location…' : 'Detect my current location'}
              </p>
              <p className="text-xs text-ink-400 dark:text-ink-500">
                Helps us find mechanics near you
              </p>
            </div>
          </button>

          <AnimatePresence>
            {location && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {location}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Password with strength meter ────────────────────────────────── */}
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPw ? 'text' : 'password'}
              placeholder="Min. 6 characters"
              className="input pr-10"
              autoComplete="new-password"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 transition-colors hover:text-ink-600 dark:hover:text-ink-200"
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="h-3 w-3" /> {errors.password.message}
            </p>
          )}

          {/* Password strength bar */}
          {watchedPassword.length > 0 && (
            <div className="mt-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                      i <= strength.score ? strength.color : 'bg-ink-200 dark:bg-ink-700'
                    }`}
                  />
                ))}
              </div>
              <p
                className={`mt-1 text-[11px] font-medium ${
                  strength.score <= 1
                    ? 'text-red-500'
                    : strength.score <= 2
                      ? 'text-orange-500'
                      : strength.score <= 3
                        ? 'text-amber-500'
                        : 'text-emerald-500'
                }`}
              >
                {strength.label}
              </p>
            </div>
          )}
        </div>

        {/* ── Confirm Password ────────────────────────────────────────────── */}
        <div>
          <label className="label" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPw ? 'text' : 'password'}
              placeholder="Repeat your password"
              className="input pr-10"
              autoComplete="new-password"
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPw(!showConfirmPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 transition-colors hover:text-ink-600 dark:hover:text-ink-200"
              aria-label={showConfirmPw ? 'Hide password' : 'Show password'}
            >
              {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="h-3 w-3" /> {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* ── Submit ──────────────────────────────────────────────────────── */}
        <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
          <UserPlus className="h-5 w-5" /> Create Account
        </Button>

        {/* ── Trust badges ────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-1">
          {trustBadges.map((b) => (
            <span
              key={b.text}
              className="flex items-center gap-1.5 text-[11px] text-ink-400 dark:text-ink-500"
            >
              <b.icon className="h-3.5 w-3.5 text-emerald-500" />
              {b.text}
            </span>
          ))}
        </div>
      </form>

      {/* ── Footer links ──────────────────────────────────────────────────── */}
      <p className="mt-6 text-center text-sm text-ink-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
