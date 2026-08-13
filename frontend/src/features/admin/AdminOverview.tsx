import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Wrench, CalendarCheck, DollarSign, UserCheck, PackageX, HandCoins, PiggyBank, BadgeCheck, Hourglass, XCircle } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { KpiCard } from '@/components/ui/KpiCard';
import { CardSkeleton, ErrorState } from '@/components/ui/Feedback';
import { titleCase } from '@/lib/utils';

const PIE_COLORS = ['#f97316', '#10b981', '#8b5cf6', '#0ea5e9', '#ef4444', '#64748b'];

export function AdminOverview() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['admin-dashboard'], queryFn: adminApi.dashboard });

  if (isLoading) return <CardSkeleton count={6} />;
  if (isError || !data) return <ErrorState message="Could not load dashboard" onRetry={() => refetch()} />;

  const statusData = Object.entries(data.bookingsByStatus ?? {}).map(([name, value]) => ({ name: titleCase(name), value }));
  const pieData = [
    { name: 'Customers', value: data.totalCustomers },
    { name: 'Mechanics', value: data.totalMechanics },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink-900 dark:text-ink-100">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-ink-500">Platform overview at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard label="Total Users" value={data.totalUsers} icon={<Users className="h-5 w-5" />} accent="brand" />
        <KpiCard label="Customers" value={data.totalCustomers} icon={<Users className="h-5 w-5" />} accent="sky" />
        <KpiCard label="Mechanics" value={data.totalMechanics} icon={<Wrench className="h-5 w-5" />} accent="violet" />
        <KpiCard label="Total Bookings" value={data.totalBookings} icon={<CalendarCheck className="h-5 w-5" />} accent="amber" />
        <KpiCard
          label="Pending Approvals"
          value={data.pendingMechanicApprovals}
          icon={<UserCheck className="h-5 w-5" />}
          accent="rose"
          hint={data.pendingMechanicApprovals ? 'Action required' : 'All clear'}
        />
        <KpiCard label="Low Stock Parts" value={data.lowStockPartsCount} icon={<PackageX className="h-5 w-5" />} accent="amber" />
      </div>

      {/* Revenue split */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-ink-900 dark:text-ink-100">Revenue & Payments</h2>
          <span className="text-xs font-semibold text-ink-400">Paid bookings only</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Total Service Revenue" value={`₹${(data.totalServiceRevenue ?? 0).toLocaleString('en-IN')}`} icon={<DollarSign className="h-5 w-5" />} accent="emerald" />
          <KpiCard label="Platform Commission" value={`₹${(data.platformCommission ?? 0).toLocaleString('en-IN')}`} icon={<HandCoins className="h-5 w-5" />} accent="amber" />
          <KpiCard label="Mechanic Earnings" value={`₹${(data.mechanicEarnings ?? 0).toLocaleString('en-IN')}`} icon={<PiggyBank className="h-5 w-5" />} accent="sky" />
          <KpiCard label="Gross Revenue (txns)" value={`₹${(data.totalRevenue ?? 0).toLocaleString('en-IN')}`} icon={<BadgeCheck className="h-5 w-5" />} accent="violet" />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <KpiCard label="Successful Payments" value={data.successfulPayments ?? 0} icon={<BadgeCheck className="h-5 w-5" />} accent="emerald" />
          <KpiCard label="Pending Payments" value={data.pendingPayments ?? 0} icon={<Hourglass className="h-5 w-5" />} accent="amber" />
          <KpiCard label="Failed Payments" value={data.failedPayments ?? 0} icon={<XCircle className="h-5 w-5" />} accent="rose" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-4 text-base font-bold text-ink-900 dark:text-ink-100">Bookings by Status</h3>
          {statusData.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-400">No booking data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={statusData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: 'rgba(148,163,184,0.08)' }} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#f97316" maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <h3 className="mb-4 text-base font-bold text-ink-900 dark:text-ink-100">Customers vs Mechanics</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4}>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex justify-center gap-6 text-xs font-medium text-ink-500">
            {pieData.map((d, i) => (
              <span key={d.name} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} /> {d.name} ({d.value})
              </span>
            ))}
          </div>
        </div>
      </div>

      {data.lowStockPartsCount > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
          <PackageX className="h-5 w-5 shrink-0" />
          <span><b>{data.lowStockPartsCount}</b> spare part(s) are running low on stock. Restock soon.</span>
        </div>
      )}
    </div>
  );
}
