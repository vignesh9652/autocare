import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { Button, Card, Input } from '@/components';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const from = (location.state as { from?: string } | null)?.from || '/vehicles';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Invalid email or password'));
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

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <Input
            label="Email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
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
