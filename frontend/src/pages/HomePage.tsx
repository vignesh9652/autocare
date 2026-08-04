import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

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
    // The gateway routes only specific /api/** paths, so probe a public one.
    // /api/parts is a public catalog endpoint routed to spareparts-service.
    try {
      await api.get('/parts?limit=1');
      setHealth({ checking: false, gateway: true, parts: true, checkedAt: new Date().toLocaleTimeString() });
    } catch {
      setHealth({ checking: false, gateway: false, parts: false, checkedAt: new Date().toLocaleTimeString() });
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="container">
      <section className="hero">
        <h1>Your car, serviced by experts.</h1>
        <p>
          AutoCare is a microservices-powered platform for booking vehicle repairs, tracking
          spare parts, and managing payments — all through a single API Gateway.
        </p>
        <div className="actions">
          <Link to="/register" className="btn">Get Started</Link>
          <Link to="/login" className="btn secondary">Sign In</Link>
        </div>
      </section>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.4rem' }}>Platform Status</h2>
          <button className="btn ghost" onClick={checkHealth} disabled={health.checking}>
            {health.checking ? 'Checking…' : 'Refresh'}
          </button>
        </div>
        <div className="grid">
          <div className="card hoverable">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1rem' }}>API Gateway + Backend</h3>
              <span className={`status-dot ${health.gateway ? 'up' : 'down'}`} />
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              {health.gateway ? 'Reachable — services are online' : 'Unreachable — start the backend stack'}
            </p>
            {health.checkedAt && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                Last checked: {health.checkedAt}
              </p>
            )}
          </div>
          <div className="card hoverable">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1rem' }}>Spare Parts Catalog</h3>
              <span className={`status-dot ${health.parts ? 'up' : 'down'}`} />
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              {health.parts ? 'Public catalog endpoint is live' : 'Endpoint not reachable'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
