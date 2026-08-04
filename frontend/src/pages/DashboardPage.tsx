import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getToken } from '../api/client';
import type { Vehicle, Booking } from '../types';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      navigate('/login');
      return;
    }
    Promise.all([api.get<Vehicle[]>('/vehicles'), api.get<Booking[]>('/bookings')])
      .then(([v, b]) => {
        setVehicles(v);
        setBookings(b);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load data'))
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) {
    return <div className="container" style={{ paddingTop: '4rem', textAlign: 'center' }}>Loading dashboard…</div>;
  }

  return (
    <div className="container" style={{ paddingTop: '2.5rem' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Dashboard</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Your vehicles and service bookings.
      </p>
      {error && <p className="error">{error}</p>}

      <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>My Vehicles</h2>
      {vehicles.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No vehicles yet.</p>
      ) : (
        <div className="grid" style={{ marginBottom: '2.5rem' }}>
          {vehicles.map((v) => (
            <div className="card hoverable" key={v.id}>
              <h3 style={{ fontSize: '1rem' }}>{v.make} {v.model} ({v.year})</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {v.registrationNumber} · <span className="badge">{v.vehicleType}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>My Bookings</h2>
      {bookings.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No bookings yet.</p>
      ) : (
        <div className="grid">
          {bookings.map((b) => (
            <div className="card hoverable" key={b.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1rem' }}>{b.serviceType}</h3>
                <span className="badge">{b.status}</span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                {new Date(b.scheduledAt).toLocaleString()}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{b.address}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
