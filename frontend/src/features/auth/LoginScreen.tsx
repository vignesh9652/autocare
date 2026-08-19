import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { LogIn, Eye, EyeOff, KeyRound } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { getErrorMessage } from '@/lib/api';
import { toast } from '@/stores/toast-store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthShell } from './AuthShell';
import { LOGIN_BG } from '@/lib/images';

const schema = z.object({
  // Normalize at the schema level so validation runs on the trimmed/lowercased
  // value — otherwise a pasted email with a trailing space would fail the
  // .email() check before onSubmit ever ran (classic "Invalid credentials").
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().trim().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

export function LoginScreen() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    try {
      // values.email / values.password are already trimmed + normalized by the schema.
      const user = await login(values.email, values.password);
      toast(`Welcome back, ${user.name}!`, 'success');
      navigate(user.role === 'ADMIN' ? '/admin' : user.role === 'MECHANIC' ? '/mechanic' : '/dashboard');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to manage your vehicles and bookings" bgImage={LOGIN_BG}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Email" id="email" type="email" placeholder="you@example.com" autoComplete="email"
          error={errors.email?.message} {...register('email')} />
        <div>
          <label className="label" htmlFor="password">Password</label>
          <div className="relative">
            <input id="password" type={showPw ? 'text' : 'password'} placeholder="Enter your password"
              className="input pr-10" autoComplete="current-password" {...register('password')} />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>}
        </div>

        <div className="flex justify-end">
          <Link to="/forgot-password" className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700">
            <KeyRound className="h-3.5 w-3.5" /> Forgot password?
          </Link>
        </div>

        <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
          <LogIn className="h-5 w-5" /> Sign In
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Don't have an account?{' '}
        <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">Create one</Link>
      </p>
      <p className="mt-2 text-center text-xs text-ink-400">
        Are you a mechanic?{' '}
        <Link to="/register/mechanic" className="font-semibold text-brand-600 hover:text-brand-700">Apply here</Link>
      </p>
    </AuthShell>
  );
}
