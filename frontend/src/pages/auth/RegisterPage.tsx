import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '@/api/client';
import { registerUser } from '@/api/authApi';
import { Button, Card, Input } from '@/components';

interface FormState {
  name: string;
  email: string;
  phone: string;
  password: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const EMPTY: FormState = { name: '', email: '', phone: '', password: '' };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Phone is optional, but if provided it should look like one: digits, spaces,
// dashes, parentheses and a leading +, between 7 and 15 characters.
const PHONE_RE = /^\+?[0-9\s()-]{7,15}$/;

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

  return errors;
}

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    // Clear the inline error for the field being edited.
    setErrors((prev) => (prev[name as keyof FormState] ? { ...prev, [name]: undefined } : prev));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setIsSubmitting(true);
    try {
      await registerUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
      });
      navigate('/login', {
        replace: true,
        state: { success: 'Account created successfully — please sign in.' },
      });
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, 'Registration failed. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <Card className="w-full max-w-md p-8 animate-slide-up">
        <div className="mb-6 text-center">
          <span className="text-3xl" aria-hidden>🚗</span>
          <h1 className="mt-2 text-2xl font-bold text-slate-100">Create your account</h1>
          <p className="mt-1 text-sm text-slate-400">Join AutoCare and book repairs online</p>
        </div>

        {submitError && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
          >
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
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
            label="Phone (optional)"
            name="phone"
            type="tel"
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
          <Button type="submit" loading={isSubmitting} className="w-full">
            {isSubmitting ? 'Creating account…' : 'Create Account'}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-brand-400 hover:text-brand-300">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
