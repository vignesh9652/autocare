import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  BellRing,
  CalendarClock,
  Car,
  CheckCircle2,
  CreditCard,
  Plus,
  ShoppingBag,
  Wrench,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApiData } from '@/hooks/useApiData';
import PageHeader from '@/components/ui/PageHeader';
import KpiCard from '@/components/ui/KpiCard';
import Badge from '@/components/ui/Badge';
import Skeleton, { CardSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { ProgressRing, AreaTrendChart } from '@/components/charts';
import { getVehicles } from '@/api/vehicleApi';
import { getBookings } from '@/api/bookingApi';
import { getPayments } from '@/api/paymentApi';
import { getMechanics } from '@/api/mechanicApi';
import {
  buildNotifications,
  monthlySeries,
  paidBookingIdsFrom,
  toDashBooking,
  toDashMechanic,
  toDashVehicle,
} from '@/utils/apiMappers';
import { formatCurrency, formatDate } from '@/utils/format';
import { bookingStatusVariant } from '@/utils/status';

const QUICK_ACTIONS = [
  { label: 'Add Vehicle', to: '/customer/vehicles', icon: Plus, tint: 'from-brand-600 to-sky-500' },
  { label: 'Book Mechanic', to: '/customer/book-service', icon: Wrench, tint: 'from-emerald-500 to-teal-500' },
  { label: 'Buy Spare Parts', to: '/customer/parts', icon: ShoppingBag, tint: 'from-amber-500 to-orange-500' },
  { label: 'View Bookings', to: '/customer/bookings', icon: CalendarClock, tint: 'from-violet-500 to-purple-500' },
];

export default function CustomerDashboard() {
  const { user } = useAuth();
  const vehicles = useApiData(() => getVehicles(), []);
  const bookings = useApiData(() => getBookings(), []);
  const payments = useApiData(() => getPayments(), []);
  const mechanics = useApiData(() => getMechanics(), []);

  const loading = vehicles.loading || bookings.loading || payments.loading || mechanics.loading;

  const firstName = user?.email?.split('@')[0]?.replace(/[._-]/g, ' ') ?? 'there';
  const name = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  const dashVehicles = (vehicles.data ?? []).map(toDashVehicle);
  const vehicleMap = new Map(dashVehicles.map((v) => [v.id, v]));
  const mechanicMap = new Map((mechanics.data ?? []).map((m) => [toDashMechanic(m).id, toDashMechanic(m)]));
  const paidBookingIds = paidBookingIdsFrom(payments.data ?? []);
  const dashBookings = (bookings.data ?? []).map((b) =>
    toDashBooking(b, vehicleMap, mechanicMap, paidBookingIds),
  );

  const activeBookings = dashBookings.filter((b) =>
    ['PENDING', 'ACCEPTED', 'IN_PROGRESS'].includes(b.status),
  );
  const completed = dashBookings.filter((b) => b.status === 'COMPLETED').length;
  const totalSpent = (payments.data ?? [])
    .filter((p) => p.status === 'SUCCESS')
    .reduce((sum, p) => sum + p.amount, 0);

  const now = Date.now();
  const upcoming = [...activeBookings]
    .filter((b) => new Date(`${b.date}T${b.time || '00:00'}`).getTime() >= now)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  const nextService = upcoming[0];

  const healthFor = (vehicleId: number) => {
    const done = dashBookings.filter((b) => b.vehicleId === vehicleId && b.status === 'COMPLETED').length;
    const active = dashBookings.filter(
      (b) => b.vehicleId === vehicleId && ['PENDING', 'ACCEPTED', 'IN_PROGRESS'].includes(b.status),
    ).length;
    return Math.min(100, Math.max(40, 60 + done * 15 - active * 10));
  };
  const avgHealth =
    dashVehicles.length === 0
      ? 0
      : Math.round(dashVehicles.reduce((s, v) => s + healthFor(v.id), 0) / dashVehicles.length);

  const latestBooking = [...dashBookings].sort((a, b) => (a.date > b.date ? -1 : 1))[0];
  const recentNotifs = buildNotifications(bookings.data ?? [], payments.data ?? []).slice(0, 4);
  const spendingTrend = monthlySeries(payments.data ?? [], (p) => p.createdAt, (p) => p.amount);
  const lowHealth = dashVehicles.find((v) => healthFor(v.id) < 65);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Welcome back, ${name} 👋`}
        subtitle={`Here's what's happening with your vehicles · ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}`}
      />

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Vehicles" value={dashVehicles.length} icon={<Car className="h-5 w-5" />} accent="brand" loading={loading} />
        <KpiCard label="Active Bookings" value={activeBookings.length} icon={<CalendarClock className="h-5 w-5" />} accent="violet" loading={loading} />
        <KpiCard label="Completed Services" value={completed} icon={<CheckCircle2 className="h-5 w-5" />} accent="emerald" loading={loading} />
        <KpiCard label="Total Money Spent" value={formatCurrency(totalSpent)} icon={<CreditCard className="h-5 w-5" />} accent="amber" loading={loading} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Upcoming service reminder */}
            <div className="card p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Upcoming Service</h3>
                {nextService && <Badge variant="warning" dot>Due soon</Badge>}
              </div>
              {loading ? (
                <CardSkeleton />
              ) : nextService ? (
                <div>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
                      <BellRing className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {nextService.service}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {nextService.vehicle.split('·')[0].trim()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-xl bg-amber-50/70 p-3 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                    Scheduled on{' '}
                    <span className="font-bold">{formatDate(nextService.date)}</span> ·{' '}
                    {nextService.time}
                  </div>
                  <Link
                    to="/customer/book-service"
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                  >
                    <CalendarClock className="h-4 w-4" /> Book this service
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No upcoming services — book one when you're ready.
                </p>
              )}
            </div>

            {/* Latest booking status */}
            <div className="card p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Latest Booking</h3>
                {latestBooking && (
                  <Badge variant={bookingStatusVariant(latestBooking.status)} dot>{latestBooking.status.replace('_', ' ')}</Badge>
                )}
              </div>
              {loading ? (
                <CardSkeleton />
              ) : latestBooking ? (
                <div>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                      <Wrench className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {latestBooking.service}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {latestBooking.id} · {formatDate(latestBooking.date)} · {latestBooking.time}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                    <p className="flex justify-between"><span>Mechanic</span><span className="font-semibold text-slate-700 dark:text-slate-200">{latestBooking.mechanic}</span></p>
                    <p className="flex justify-between"><span>Vehicle</span><span className="font-semibold text-slate-700 dark:text-slate-200">{latestBooking.vehicle.split('·')[0].trim()}</span></p>
                    <p className="flex justify-between"><span>Amount</span><span className="font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(latestBooking.amount)}</span></p>
                  </div>
                  <Link
                    to="/customer/bookings"
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                  >
                    Track booking
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No bookings yet — book your first service.
                </p>
              )}
            </div>
          </div>

          {/* Spending trend */}
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Spending Overview</h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Last 7 months across all your payments</p>
              </div>
              <Badge variant="brand" dot>Live</Badge>
            </div>
            {loading ? (
              <Skeleton className="h-56 w-full" />
            ) : spendingTrend.every((p) => p.total === 0) ? (
              <p className="py-16 text-center text-sm text-slate-500 dark:text-slate-400">
                No payments recorded yet — spending appears here as you pay for services.
              </p>
            ) : (
              <AreaTrendChart
                data={spendingTrend}
                series={[{ key: 'total', name: 'Spent', color: '#2563eb' }]}
                formatter={(v) => formatCurrency(v)}
                height={220}
              />
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Vehicle health */}
          <div className="card p-5">
            <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-slate-100">Vehicle Health</h3>
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : dashVehicles.length === 0 ? (
              <EmptyState
                title="No vehicles yet"
                description="Add a vehicle to start booking services."
                action={
                  <Link to="/customer/vehicles" className="btn btn-secondary btn-sm">
                    <Plus className="h-3.5 w-3.5" /> Add Vehicle
                  </Link>
                }
              />
            ) : (
              <div className="flex items-center justify-around gap-2">
                <ProgressRing value={avgHealth} size={132} color="#2563eb" label="Average" />
                <div className="space-y-2.5 text-xs">
                  {dashVehicles.slice(0, 3).map((v) => {
                    const score = healthFor(v.id);
                    return (
                      <div key={v.id} className="flex items-center gap-2">
                        <span className="w-16 truncate font-medium text-slate-600 dark:text-slate-300">
                          {v.model}
                        </span>
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                          <div
                            className={`h-full rounded-full ${score >= 80 ? 'bg-emerald-500' : score >= 65 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                        <span className="w-7 text-right font-bold text-slate-700 dark:text-slate-200">{score}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <Link to="/customer/vehicles" className="mt-4 block text-center text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">
              View all vehicles →
            </Link>
          </div>

          {/* Quick actions */}
          <div className="card p-5">
            <h3 className="mb-3 text-sm font-bold text-slate-900 dark:text-slate-100">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {QUICK_ACTIONS.map((a) => {
                const Icon = a.icon;
                return (
                  <Link
                    key={a.label}
                    to={a.to}
                    className="group flex flex-col items-start gap-2.5 rounded-xl border border-slate-200 p-3.5 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:border-slate-700 dark:hover:border-brand-500/50"
                  >
                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${a.tint} text-white shadow-md transition-transform group-hover:scale-110`}>
                      <Icon style={{ height: '1.125rem', width: '1.125rem' }} />
                    </span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{a.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Recent notifications */}
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Recent Notifications</h3>
              <Link to="/customer/notifications" className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">
                View all
              </Link>
            </div>
            {recentNotifs.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-500 dark:text-slate-400">
                No updates yet.
              </p>
            ) : (
              <div className="space-y-3">
                {recentNotifs.map((n) => (
                  <div key={n.id} className="flex items-start gap-3">
                    <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-slate-200 dark:bg-slate-700' : 'bg-brand-500'}`} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{n.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {lowHealth && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-400">
                <span className="font-bold">{lowHealth.brand} {lowHealth.model}</span> has an active
                service or none completed recently. Book a check-up to keep it in top shape.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
