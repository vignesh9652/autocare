import { Link } from 'react-router-dom';
import {
  Activity,
  CalendarDays,
  IndianRupee,
  PackageX,
  ShieldCheck,
  Users,
  Wrench,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApiData } from '@/hooks/useApiData';
import PageHeader from '@/components/ui/PageHeader';
import KpiCard from '@/components/ui/KpiCard';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import { AreaTrendChart, BarTrendChart, DonutChart } from '@/components/charts';
import { getDashboard, getAdminUsers } from '@/api/adminApi';
import { getAllBookings } from '@/api/bookingApi';
import { getAllPayments } from '@/api/paymentApi';
import { getParts } from '@/api/sparePartsApi';
import { monthlySeries } from '@/utils/apiMappers';
import { formatCurrency } from '@/utils/format';
import { bookingStatusVariant } from '@/utils/status';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const dashboard = useApiData(() => getDashboard(), []);
  const users = useApiData(() => getAdminUsers(), []);
  const bookings = useApiData(() => getAllBookings(), []);
  const payments = useApiData(() => getAllPayments(), []);
  const parts = useApiData(() => getParts(), []);

  const loading =
    dashboard.loading || users.loading || bookings.loading || payments.loading || parts.loading;

  const firstName = user?.email?.split('@')[0]?.replace(/[._-]/g, ' ') ?? 'admin';
  const name = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  const d = dashboard.data;
  const customers = (users.data ?? []).filter((u) => u.role === 'CUSTOMER');
  const pendingApprovals =
    d?.pendingMechanicApprovals ??
    (users.data ?? []).filter((u) => u.role === 'MECHANIC' && u.status === 'PENDING').length;
  const allBookings = bookings.data ?? [];
  const allPayments = payments.data ?? [];

  const activeBookings =
    (d?.bookingsByStatus?.PENDING ?? 0) +
    (d?.bookingsByStatus?.ACCEPTED ?? 0) +
    (d?.bookingsByStatus?.IN_PROGRESS ?? 0);

  const now = new Date();
  const revenueMtd = allPayments
    .filter((p) => {
      if (p.status !== 'SUCCESS' || !p.createdAt) return false;
      const dt = new Date(p.createdAt);
      return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
    })
    .reduce((s, p) => s + p.amount, 0);

  const revenueTrend = monthlySeries(allPayments, (p) => p.createdAt, (p) => (p.status === 'SUCCESS' ? p.amount : 0));
  const bookingTrend = monthlySeries(allBookings, (b) => b.createdAt, () => 1);
  const customerTrend = monthlySeries(users.data ?? [], (u) => u.createdAt, () => 1);

  const serviceRevenue = allPayments
    .filter((p) => p.status === 'SUCCESS' && p.referenceType === 'BOOKING')
    .reduce((s, p) => s + p.amount, 0);
  const partRevenue = allPayments
    .filter((p) => p.status === 'SUCCESS' && p.referenceType === 'SPARE_PART')
    .reduce((s, p) => s + p.amount, 0);
  const revenueSplit = [
    { name: 'Services', value: Math.round((serviceRevenue / Math.max(1, serviceRevenue + partRevenue)) * 100), color: '#2563eb' },
    { name: 'Spare Parts', value: Math.round((partRevenue / Math.max(1, serviceRevenue + partRevenue)) * 100), color: '#10b981' },
  ].filter((s) => s.value > 0);

  const statusDonut = Object.entries(d?.bookingsByStatus ?? {}).map(([status, count]) => ({
    name: status.replace('_', ' '),
    value: count as number,
  }));

  const latestBookings = [...allBookings]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 5);

  const recentActivity = [
    ...allPayments
      .filter((p) => p.status === 'SUCCESS')
      .map((p) => ({
        action: 'Payment captured',
        actor: `${formatCurrency(p.amount)} · ${p.paymentMethod ?? 'payment'}`,
        time: p.createdAt,
        tint: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
      })),
    ...allBookings.map((b) => ({
      action: `Booking ${b.status.replace('_', ' ').toLowerCase()}`,
      actor: `#${b.id} · ${b.serviceType}`,
      time: b.createdAt,
      tint: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
    })),
  ]
    .sort((a, b) => (a.time < b.time ? 1 : -1))
    .slice(0, 6);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Platform overview, ${name} 📊`}
        subtitle="Monitor users, bookings, revenue and platform health at a glance"
      />

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Total Customers" value={d?.totalCustomers ?? customers.length} icon={<Users className="h-5 w-5" />} accent="brand" loading={loading} />
        <KpiCard label="Total Mechanics" value={d?.totalMechanics ?? 0} icon={<Wrench className="h-5 w-5" />} accent="violet" loading={loading} />
        <KpiCard
          label="Pending Approvals"
          value={pendingApprovals}
          icon={<ShieldCheck className="h-5 w-5" />}
          accent="amber"
          loading={loading}
          sub={pendingApprovals > 0 ? 'Review in Mechanic Management' : undefined}
        />
        <KpiCard label="Active Bookings" value={activeBookings} icon={<CalendarDays className="h-5 w-5" />} accent="sky" loading={loading} />
        <KpiCard label="Revenue (MTD)" value={formatCurrency(revenueMtd)} icon={<IndianRupee className="h-5 w-5" />} accent="emerald" loading={loading} />
        <KpiCard label="Total Bookings" value={d?.totalBookings ?? 0} icon={<PackageX className="h-5 w-5" />} accent="rose" loading={loading} />
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Monthly Revenue</h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Successful payments · last 7 months</p>
            </div>
            <Badge variant="success" dot>Live</Badge>
          </div>
          {loading ? (
            <Skeleton className="h-56 w-full" />
          ) : revenueTrend.every((p) => p.total === 0) ? (
            <p className="py-16 text-center text-sm text-slate-500 dark:text-slate-400">
              No successful payments recorded yet.
            </p>
          ) : (
            <AreaTrendChart
              data={revenueTrend}
              series={[{ key: 'total', name: 'Revenue', color: '#2563eb' }]}
              formatter={(v) => formatCurrency(v)}
              height={230}
            />
          )}
        </div>

        <div className="card p-5">
          <h3 className="mb-2 text-sm font-bold text-slate-900 dark:text-slate-100">Revenue Split</h3>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : revenueSplit.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-500 dark:text-slate-400">No revenue yet.</p>
          ) : (
            <>
              <DonutChart
                data={revenueSplit}
                centerValue={formatCurrency(serviceRevenue + partRevenue)}
                centerLabel="Total"
                formatter={(v) => `${v}%`}
                height={190}
              />
              <div className="mt-2 space-y-1.5">
                {revenueSplit.map((s) => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                      {s.name}
                    </span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{s.value}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="card p-5">
          <h3 className="mb-2 text-sm font-bold text-slate-900 dark:text-slate-100">Booking Trends</h3>
          <BarTrendChart
            data={bookingTrend}
            series={[{ key: 'total', name: 'Bookings', color: '#0ea5e9' }]}
            height={200}
          />
        </div>
        <div className="card p-5">
          <h3 className="mb-2 text-sm font-bold text-slate-900 dark:text-slate-100">New Customers</h3>
          <BarTrendChart
            data={customerTrend}
            series={[{ key: 'total', name: 'Customers', color: '#8b5cf6' }]}
            height={200}
          />
        </div>
        <div className="card p-5">
          <h3 className="mb-2 text-sm font-bold text-slate-900 dark:text-slate-100">Bookings by Status</h3>
          {statusDonut.length === 0 ? (
            <p className="py-14 text-center text-sm text-slate-500 dark:text-slate-400">No bookings yet.</p>
          ) : (
            <DonutChart
              data={statusDonut}
              centerValue={String(d?.totalBookings ?? 0)}
              centerLabel="bookings"
              formatter={(v) => `${v}`}
              height={200}
            />
          )}
        </div>
      </div>

      {/* Bottom grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Latest bookings */}
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Latest Bookings</h3>
            <Link to="/admin/bookings" className="text-xs font-semibold text-brand-600 dark:text-brand-400">Manage all →</Link>
          </div>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : latestBookings.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">No bookings yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {latestBookings.map((b) => (
                <div key={b.id} className="flex items-center gap-3 py-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                    <CalendarDays className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {b.serviceType} <span className="font-normal text-slate-400">· #{b.id}</span>
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      Vehicle #{b.vehicleId} · {b.scheduledAt?.slice(0, 10)}
                    </p>
                  </div>
                  <span className="hidden text-xs font-bold text-slate-700 sm:block dark:text-slate-200">
                    {b.estimatedCost ? formatCurrency(b.estimatedCost) : '—'}
                  </span>
                  <Badge variant={bookingStatusVariant(b.status)} dot>{b.status.replace('_', ' ')}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Service health */}
          <div className="card p-5">
            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-slate-100">
              <Activity className="h-4 w-4 text-brand-600 dark:text-brand-400" /> Service Health
            </h3>
            {(d?.unavailableServices?.length ?? 0) === 0 ? (
              <p className="rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                All backend services are responding normally.
              </p>
            ) : (
              <div className="space-y-2">
                {d?.unavailableServices?.map((s) => (
                  <p key={s} className="rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                    ⚠ {s} is temporarily unavailable
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Recent activity */}
          <div className="card p-5">
            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-slate-100">
              <Activity className="h-4 w-4 text-brand-600 dark:text-brand-400" /> Recent Activity
            </h3>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">No activity yet.</p>
              ) : (
                recentActivity.map((a, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${a.tint}`}>
                      <Activity className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{a.action}</p>
                      <p className="text-[11px] text-slate-400">
                        {a.actor} · {a.time ? new Date(a.time).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : ''}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
