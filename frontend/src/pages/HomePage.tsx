import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api/client';
import { Button, Card } from '@/components';

interface HealthState {
  checking: boolean;
  gateway: boolean;
  parts: boolean;
  checkedAt: string | null;
}

export default function HomePage() {
  const [health, setHealth] = useState<HealthState>({
    checking: false,
    gateway: false,
    parts: false,
    checkedAt: null,
  });

  const checkHealth = async () => {
    setHealth((h) => ({ ...h, checking: true }));
    // /api/parts is a public catalog endpoint routed to spareparts-service,
    // so it also proves the gateway + a downstream service are reachable.
    try {
      await api.get('/api/parts', { params: { limit: 1 } });
      setHealth({ checking: false, gateway: true, parts: true, checkedAt: new Date().toLocaleTimeString() });
    } catch {
      setHealth({ checking: false, gateway: false, parts: false, checkedAt: new Date().toLocaleTimeString() });
    }
  };

  useEffect(() => {
    void checkHealth();
  }, []);

  return (
    <div className="container-page">
      {/* Hero */}
      <section className="py-20 text-center">
        <h1 className="text-gradient mx-auto max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl md:text-6xl">
          Your car, serviced by experts.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-slate-500 dark:text-slate-400">
          AutoCare is a microservices-powered platform for booking vehicle repairs,
          tracking spare parts, and managing payments — all through a single API Gateway.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link to="/register">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link to="/login">
            <Button variant="ghost" size="lg">Sign In</Button>
          </Link>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="grid gap-5 pb-16 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { icon: '🔧', title: 'Expert Mechanics', text: 'Browse vetted mechanics by skill, area, and availability.' },
          { icon: '📅', title: 'Smart Bookings', text: 'Schedule repairs and track status from PENDING to COMPLETED.' },
          { icon: '🧩', title: 'Genuine Spare Parts', text: 'A catalog of parts with compatibility and installation guides.' },
        ].map((f) => (
          <Card key={f.title} hoverable>
            <div className="text-3xl">{f.icon}</div>
            <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-slate-100">{f.title}</h3>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{f.text}</p>
          </Card>
        ))}
      </section>

      {/* For mechanics */}
      <section className="pb-16">
        <Card className="relative overflow-hidden p-8 sm:p-10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" aria-hidden />
          <div className="grid items-center gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">For Mechanics</p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-slate-100">Grow your workshop with AutoCare</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Get discovered by nearby customers, accept booking requests, manage repairs and build your rating — all
                in one place. Applications are reviewed by our administrator before you go live.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link to="/register/mechanic">
                  <Button variant="secondary">Apply as a Mechanic</Button>
                </Link>
                <Link to="/login">
                  <Button variant="ghost">Mechanic Sign In</Button>
                </Link>
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-lg dark:border-slate-700 dark:bg-slate-800/70">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">How it works</p>
                <ol className="mt-3 space-y-3">
                  {[
                    ['Apply', 'Register with your skills and workshop location'],
                    ['Get approved', 'An admin reviews and approves your account'],
                    ['Accept jobs', 'Book requests appear on your dashboard'],
                    ['Earn & grow', 'Complete repairs and build your rating'],
                  ].map(([step, desc], i) => (
                    <li key={step} className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                        {i + 1}
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        <span className="font-semibold text-slate-800 dark:text-slate-100">{step}</span>
                        <span className="block text-slate-400">{desc}</span>
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Platform status */}
      <section className="pb-20">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Platform Status</h2>
          <Button variant="ghost" size="sm" onClick={checkHealth} disabled={health.checking}>
            {health.checking ? 'Checking…' : 'Refresh'}
          </Button>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Card hoverable>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">API Gateway + Backend</h3>
              <span
                className={`h-2.5 w-2.5 rounded-full ${health.gateway ? 'bg-emerald-400 shadow-glow' : 'bg-red-500'}`}
              />
            </div>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {health.gateway ? 'Reachable — services are online' : 'Unreachable — start the backend stack'}
            </p>
            {health.checkedAt && <p className="mt-2 text-xs text-slate-500">Last checked: {health.checkedAt}</p>}
          </Card>
          <Card hoverable>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Spare Parts Catalog</h3>
              <span
                className={`h-2.5 w-2.5 rounded-full ${health.parts ? 'bg-emerald-400 shadow-glow' : 'bg-red-500'}`}
              />
            </div>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {health.parts ? 'Public catalog endpoint is live' : 'Endpoint not reachable'}
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
}
