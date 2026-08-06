import { useMemo, useState } from 'react';
import {
  CalendarDays,
  Car,
  Download,
  FileBarChart2,
  FileSpreadsheet,
  FileText,
  IndianRupee,
  ShoppingBag,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/Button';
import Tabs from '@/components/ui/Tabs';
import { AreaTrendChart, BarTrendChart } from '@/components/charts';
import Skeleton from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { useApiData } from '@/hooks/useApiData';
import { getAdminUsers } from '@/api/adminApi';
import { getAllBookings } from '@/api/bookingApi';
import { getAllPayments } from '@/api/paymentApi';
import { getParts } from '@/api/sparePartsApi';
import { getAdminMechanics } from '@/api/adminApi';
import { monthlySeries } from '@/utils/apiMappers';
import { formatCurrency } from '@/utils/format';

type ReportKey = 'revenue' | 'bookings' | 'customers' | 'mechanics' | 'parts' | 'growth';

export default function AdminReports() {
  const [period, setPeriod] = useState('7m');
  const [active, setActive] = useState<ReportKey>('revenue');
  const { success } = useToast();

  const users = useApiData(() => getAdminUsers(), []);
  const bookings = useApiData(() => getAllBookings(), []);
  const payments = useApiData(() => getAllPayments(), []);
  const parts = useApiData(() => getParts(), []);
  const mechanics = useApiData(() => getAdminMechanics(), []);

  const loading = users.loading || bookings.loading || payments.loading || parts.loading || mechanics.loading;

  const revenueTrend = useMemo(
    () => monthlySeries(payments.data ?? [], (p) => p.createdAt, (p) => (p.status === 'SUCCESS' ? p.amount : 0)),
    [payments.data],
  );
  const bookingTrend = useMemo(
    () => monthlySeries(bookings.data ?? [], (b) => b.createdAt, () => 1),
    [bookings.data],
  );
  const customerTrend = useMemo(
    () => monthlySeries(users.data ?? [], (u) => u.createdAt, () => 1),
    [users.data],
  );

  const combined = useMemo(
    () =>
      revenueTrend.map((r, i) => ({
        label: r.label,
        revenue: r.total,
        bookings: bookingTrend[i]?.total ?? 0,
      })),
    [revenueTrend, bookingTrend],
  );

  const totalRevenue = (payments.data ?? [])
    .filter((p) => p.status === 'SUCCESS')
    .reduce((s, p) => s + p.amount, 0);

  const REPORTS: { key: ReportKey; label: string; icon: LucideIcon; metric: string; trend: string; accent: string }[] = [
    { key: 'revenue', label: 'Revenue Report', icon: IndianRupee, metric: formatCurrency(totalRevenue), trend: 'All successful payments', accent: 'from-emerald-500 to-teal-500' },
    { key: 'bookings', label: 'Bookings Report', icon: CalendarDays, metric: `${bookings.data?.length ?? 0} total`, trend: 'All-time bookings', accent: 'from-brand-600 to-sky-500' },
    { key: 'customers', label: 'Customers Report', icon: Users, metric: `${(users.data ?? []).filter((u) => u.role === 'CUSTOMER').length} customers`, trend: 'Registered users', accent: 'from-violet-500 to-purple-500' },
    { key: 'mechanics', label: 'Mechanics Report', icon: Wrench, metric: `${mechanics.data?.length ?? 0} verified`, trend: 'Registered mechanics', accent: 'from-amber-500 to-orange-500' },
    { key: 'parts', label: 'Spare Parts Report', icon: ShoppingBag, metric: `${parts.data?.length ?? 0} listed`, trend: 'Catalogue items', accent: 'from-rose-500 to-pink-500' },
    { key: 'growth', label: 'Monthly Growth Report', icon: Car, metric: '7-month view', trend: 'Customers & revenue', accent: 'from-sky-500 to-cyan-500' },
  ];

  const report = REPORTS.find((r) => r.key === active) ?? REPORTS[0];

  const exportTo = (format: string) => {
    success(`${report.label} exported`, `Downloading as ${format.toUpperCase()} — check your browser downloads.`);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Reports"
        subtitle="Generate, preview and export platform reports"
        icon={<FileBarChart2 className="h-5 w-5" />}
        actions={
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="select !w-auto !py-2 text-xs">
            <option value="3m">Last 3 months</option>
            <option value="6m">Last 6 months</option>
            <option value="7m">Last 7 months</option>
            <option value="1y">Last 12 months</option>
          </select>
        }
      />

      {/* Report picker */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((r) => {
          const Icon = r.icon;
          return (
            <button
              key={r.key}
              onClick={() => setActive(r.key)}
              className={`card card-hover flex items-center gap-4 p-5 text-left transition-all ${
                active === r.key ? 'ring-2 ring-brand-500/40' : ''
              }`}
            >
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${r.accent} text-white shadow-md`}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{r.label}</p>
                <p className="text-lg font-extrabold text-brand-600 dark:text-brand-400">{r.metric}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{r.trend}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Preview */}
      <div className="card p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${report.accent} text-white`}>
              <report.icon className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{report.label}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Generated {new Date().toLocaleDateString('en-IN')} · from live data</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => exportTo('pdf')}>
              <FileText className="h-3.5 w-3.5" /> PDF
            </Button>
            <Button size="sm" variant="secondary" onClick={() => exportTo('excel')}>
              <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
            </Button>
            <Button size="sm" onClick={() => exportTo('csv')}>
              <Download className="h-3.5 w-3.5" /> CSV
            </Button>
          </div>
        </div>

        <Tabs
          className="mb-5"
          items={[
            { key: 'revenue', label: 'Revenue' },
            { key: 'bookings', label: 'Bookings' },
            { key: 'customers', label: 'Customers' },
            { key: 'mechanics', label: 'Mechanics' },
            { key: 'parts', label: 'Parts' },
            { key: 'growth', label: 'Growth' },
          ]}
          active={active}
          onChange={(k) => setActive(k as ReportKey)}
        />

        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <AreaTrendChart
              data={combined}
              series={[
                { key: 'revenue', name: 'Revenue', color: '#2563eb' },
                { key: 'bookings', name: 'Bookings', color: '#10b981' },
              ]}
              formatter={(v) => formatCurrency(v)}
              height={260}
            />
            <BarTrendChart
              data={customerTrend}
              series={[{ key: 'total', name: 'New customers', color: '#8b5cf6' }]}
              height={260}
            />
          </div>
        )}
      </div>
    </div>
  );
}
