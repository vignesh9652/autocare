import { useCallback, useEffect, useState } from 'react';
import { getAdminUsers, getDashboard } from '@/api/adminApi';
import { getApiErrorMessage } from '@/api/client';
import { Card, Spinner } from '@/components';
import { formatCurrency } from '@/utils/format';
import type { AdminDashboard, User } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-500',
  ACCEPTED: 'bg-brand-500',
  IN_PROGRESS: 'bg-purple-500',
  COMPLETED: 'bg-emerald-500',
  CANCELLED: 'bg-red-500',
};

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [d, u] = await Promise.all([getDashboard(), getAdminUsers()]);
      setDashboard(d);
      setUsers(u);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load admin dashboard'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <Spinner label="Loading admin dashboard…" className="py-24" />;
  }

  if (error) {
    return (
      <div className="container-page py-16">
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Users', value: dashboard?.totalUsers ?? 0, icon: '👥' },
    { label: 'Total Mechanics', value: dashboard?.totalMechanics ?? 0, icon: '🔧' },
    { label: 'Total Bookings', value: dashboard?.totalBookings ?? 0, icon: '📅' },
    { label: 'Total Revenue', value: formatCurrency(dashboard?.totalRevenue), icon: '💰' },
    { label: 'Low Stock Parts', value: dashboard?.lowStockPartsCount ?? 0, icon: '📦' },
  ];

  const statusEntries = Object.entries(dashboard?.bookingsByStatus ?? {});
  const maxStatus = Math.max(1, ...statusEntries.map(([, v]) => v));

  return (
    <div className="container-page py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">Platform overview aggregated from all services</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label} hoverable>
            <div className="text-2xl">{s.icon}</div>
            <div className="mt-2 text-2xl font-extrabold text-slate-100">{s.value}</div>
            <div className="mt-0.5 text-xs uppercase tracking-wide text-slate-400">{s.label}</div>
          </Card>
        ))}
      </div>

      {dashboard?.unavailableServices?.length ? (
        <div className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          ⚠️ Some services were unreachable: {dashboard.unavailableServices.join(', ')}
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Bookings by status */}
        <Card title="Bookings by Status">
          {statusEntries.length === 0 ? (
            <p className="text-sm text-slate-400">No booking data.</p>
          ) : (
            <div className="space-y-3">
              {statusEntries.map(([status, count]) => (
                <div key={status}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-slate-300">{status}</span>
                    <span className="text-slate-400">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full ${STATUS_COLORS[status] ?? 'bg-slate-500'}`}
                      style={{ width: `${(count / maxStatus) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Users */}
        <Card title="Registered Users" subtitle={`${users.length} total`}>
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Email</th>
                  <th className="pb-2">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="py-2 font-medium text-slate-200">{u.name}</td>
                    <td className="py-2 text-slate-400">{u.email}</td>
                    <td className="py-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-500/15 text-purple-400'
                            : u.role === 'MECHANIC'
                              ? 'bg-brand-500/15 text-brand-300'
                              : 'bg-slate-500/15 text-slate-400'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
