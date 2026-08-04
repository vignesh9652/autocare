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
        <p className="mx-auto mt-5 max-w-xl text-lg text-slate-400">
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
            <h3 className="mt-3 text-lg font-semibold text-slate-100">{f.title}</h3>
            <p className="mt-1.5 text-sm text-slate-400">{f.text}</p>
          </Card>
        ))}
      </section>

      {/* Platform status */}
      <section className="pb-20">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-100">Platform Status</h2>
          <Button variant="ghost" size="sm" onClick={checkHealth} disabled={health.checking}>
            {health.checking ? 'Checking…' : 'Refresh'}
          </Button>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Card hoverable>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100">API Gateway + Backend</h3>
              <span
                className={`h-2.5 w-2.5 rounded-full ${health.gateway ? 'bg-emerald-400 shadow-glow' : 'bg-red-500'}`}
              />
            </div>
            <p className="mt-2 text-sm text-slate-400">
              {health.gateway ? 'Reachable — services are online' : 'Unreachable — start the backend stack'}
            </p>
            {health.checkedAt && <p className="mt-2 text-xs text-slate-500">Last checked: {health.checkedAt}</p>}
          </Card>
          <Card hoverable>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100">Spare Parts Catalog</h3>
              <span
                className={`h-2.5 w-2.5 rounded-full ${health.parts ? 'bg-emerald-400 shadow-glow' : 'bg-red-500'}`}
              />
            </div>
            <p className="mt-2 text-sm text-slate-400">
              {health.parts ? 'Public catalog endpoint is live' : 'Endpoint not reachable'}
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
}
