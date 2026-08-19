import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Car, CalendarCheck, CreditCard, ArrowRight, MapPin, ShoppingBag } from 'lucide-react';
import { vehicleApi, bookingApi, paymentApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { KpiCard } from '@/components/ui/KpiCard';
import { StatusBadge } from '@/components/ui/Badge';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { formatDateTime } from '@/lib/utils';

export function CustomerOverview() {
  const user = useAuthStore((s) => s.user);
  const vehicles = useQuery({ queryKey: ['my-vehicles'], queryFn: vehicleApi.getMyVehicles });
  const bookings = useQuery({ queryKey: ['my-bookings'], queryFn: bookingApi.getMine });
  const payments = useQuery({ queryKey: ['my-payments'], queryFn: paymentApi.getMine });

  if (vehicles.isLoading || bookings.isLoading || payments.isLoading) return <CardSkeleton count={4} />;
  if (vehicles.isError || bookings.isError) return <ErrorState message="Could not load your dashboard" />;

  const active = bookings.data?.filter((b) => ['PENDING', 'ACCEPTED', 'IN_PROGRESS'].includes(b.status)) ?? [];
  const spent = payments.data?.filter((p) => p.status === 'SUCCESS').reduce((s, p) => s + p.amount, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900 dark:text-ink-100">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="mt-1 text-sm text-ink-500">Here's what's happening with your vehicles.</p>
        </div>
        <Link to="/dashboard/book-service">
          <Button size="lg"><MapPin className="h-5 w-5" /> Book a Service</Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="My Vehicles" value={vehicles.data?.length ?? 0} icon={<Car className="h-5 w-5" />} accent="brand" />
        <KpiCard label="Active Bookings" value={active.length} icon={<CalendarCheck className="h-5 w-5" />} accent="amber" hint={active.length ? 'In progress right now' : 'Nothing pending'} />
        <KpiCard label="Total Bookings" value={bookings.data?.length ?? 0} icon={<MapPin className="h-5 w-5" />} accent="sky" />
        <KpiCard label="Total Spent" value={`₹${spent.toLocaleString('en-IN')}`} icon={<CreditCard className="h-5 w-5" />} accent="emerald" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-ink-900 dark:text-ink-100">Recent Bookings</h2>
            <Link to="/dashboard/bookings" className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400">View all →</Link>
          </div>
          {!bookings.data || bookings.data.length === 0 ? (
            <EmptyState icon={<CalendarCheck className="h-6 w-6" />} title="No bookings yet" description="Book your first doorstep service." action={<Link to="/dashboard/book-service"><Button>Book Service</Button></Link>} />
          ) : (
            <div className="space-y-3">
              {bookings.data.slice(0, 4).map((b) => (
                <motion.div key={b.id} whileHover={{ x: 2 }} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-semibold text-ink-900 dark:text-ink-100">{b.serviceType}</p>
                    <p className="text-xs text-ink-400">{formatDateTime(b.scheduledAt)} · {b.address.slice(0, 40)}{b.address.length > 40 ? '…' : ''}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge kind="booking" status={b.status} />
                    <Link to={`/dashboard/bookings?focus=${b.id}`} className="text-brand-600 hover:underline dark:text-brand-400"><ArrowRight className="h-4 w-4" /></Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-ink-900 dark:text-ink-100">Quick Actions</h2>
          </div>
          <div className="space-y-3">
            <Link to="/dashboard/vehicles" className="card flex items-center gap-3 p-4 transition hover:border-brand-400">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"><Car className="h-5 w-5" /></div>
              <div><p className="text-sm font-semibold text-ink-900 dark:text-ink-100">Manage Vehicles</p><p className="text-xs text-ink-400">Add or update your fleet</p></div>
            </Link>
            <Link to="/dashboard/marketplace" className="card flex items-center gap-3 p-4 transition hover:border-brand-400">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400"><ShoppingBag className="h-5 w-5" /></div>
              <div><p className="text-sm font-semibold text-ink-900 dark:text-ink-100">Shop Spare Parts</p><p className="text-xs text-ink-400">Genuine parts, doorstep delivery</p></div>
            </Link>
            <Link to="/dashboard/reviews" className="card flex items-center gap-3 p-4 transition hover:border-brand-400">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">★</div>
              <div><p className="text-sm font-semibold text-ink-900 dark:text-ink-100">Rate a Service</p><p className="text-xs text-ink-400">Share your experience</p></div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
