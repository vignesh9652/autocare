import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { Button, Card, Input } from '@/components';

interface FormState {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

const EMPTY: FormState = { name: '', email: '', phone: '', password: '', confirmPassword: '' };

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
      });
      navigate('/vehicles', { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Registration failed. Please try again.'));
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

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <Input
            label="Full Name"
            name="name"
            required
            value={form.name}
            onChange={handleChange}
            placeholder="Jane Doe"
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
          />
          <Input
            label="Phone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="9876543210"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            placeholder="At least 6 characters"
            hint="Minimum 6 characters"
          />
          <Input
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Repeat your password"
          />
          <Button type="submit" loading={isLoading} className="w-full">
            {isLoading ? 'Creating account…' : 'Create Account'}
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
