import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBookings } from '@/api/bookingApi';
import { getApiErrorMessage } from '@/api/client';
import { Button, Card, StatusBadge } from '@/components';
import { formatCurrency, formatDateTime } from '@/utils/format';
import type { Booking } from '@/types';

export default function BookingList() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const all = await getBookings();
      // Newest scheduled first, per the spec.
      setBookings([...all].sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt)));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load bookings'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="container-page py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">My Bookings</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Schedule repairs and track their progress</p>
        </div>
        <Link to="/bookings/new">
          <Button>+ New Booking</Button>
        </Link>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div key={i} className="card h-28 animate-pulse bg-slate-50/70 dark:bg-slate-800/50" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="text-4xl" aria-hidden>📅</p>
          <p className="mt-3 text-slate-500 dark:text-slate-400">No bookings yet.</p>
          <p className="mt-1 text-sm text-slate-500">Schedule your first service in a minute.</p>
          <Link to="/bookings/new" className="mt-4 inline-block">
            <Button variant="secondary">Create a booking</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <Link key={b.id} to={`/bookings/${b.id}`} className="block">
              <Card hoverable>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      {b.serviceType}
                      <span className="ml-2 text-sm font-normal text-slate-500">#{b.id}</span>
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      Vehicle #{b.vehicleId}
                      {b.mechanicId ? ` · Mechanic #${b.mechanicId}` : ' · Awaiting mechanic'}
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>

                <div className="mt-3 grid gap-2 text-sm text-slate-500 dark:text-slate-400 sm:grid-cols-3">
                  <span>📅 {formatDateTime(b.scheduledAt)}</span>
                  <span>📍 {b.address}</span>
                  <span>💰 {formatCurrency(b.estimatedCost)}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
