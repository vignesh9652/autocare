import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button, Card, Input } from '@/components';

interface FormState {
  email: string;
  password: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_RE.test(form.email.trim())) errors.email = 'Enter a valid email address';

  if (!form.password) errors.password = 'Password is required';

  return errors;
}

interface LocationState {
  from?: string;
  success?: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();

  const state = (location.state as LocationState | null) ?? {};
  const from = state.from || '/dashboard';

  // One-time message passed from RegisterPage. Shown immediately, then removed
  // from history state so it doesn't linger after a failed login or on refresh.
  const [success, setSuccess] = useState(state.success);

  useEffect(() => {
    if (state.success) {
      navigate(location.pathname, { replace: true, state: { ...state, success: undefined } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- capture the mount-time entry only
  }, []);

  const [form, setForm] = useState<FormState>({ email: '', password: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState('');

  const handleChange = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccess(undefined);

    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    try {
      await login(form.email.trim(), form.password);
      navigate(from, { replace: true });
    } catch {
      setFormError('Invalid email or password');
    }
  };

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <Card className="w-full max-w-md p-8 animate-slide-up">
        <div className="mb-6 text-center">
          <span className="text-3xl" aria-hidden>🚗</span>
          <h1 className="mt-2 text-2xl font-bold text-slate-100">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-400">Sign in to manage your AutoCare services</p>
        </div>

        {success && (
          <div
            role="status"
            className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400"
          >
            {success}
          </div>
        )}

        {formError && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
          >
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <Input
            label="Email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={handleChange('email')}
            placeholder="you@example.com"
            error={errors.email}
          />
          <Input
            label="Password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange('password')}
            placeholder="••••••••"
            error={errors.password}
          />
          <Button type="submit" loading={isLoading} className="w-full">
            {isLoading ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-400">
          New here?{' '}
          <Link to="/register" className="font-semibold text-brand-400 hover:text-brand-300">
            Create an account
          </Link>
        </p>
      </Card>
    </div>
  );
}
