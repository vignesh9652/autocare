import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Wrench, XCircle, CreditCard, Star, CalendarClock } from 'lucide-react';
import { bookingApi, getErrorMessage, mechanicApi, partsApi } from '@/lib/api';
import { toast } from '@/stores/toast-store';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { BookingTimeline } from '@/features/booking/BookingTimeline';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/ui/Feedback';
import { partImageUrl } from '@/lib/images';
import { SPARE_PART_INSTALLATION } from '@/types';

export function MyInstallations() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: bookingApi.getMine,
    refetchInterval: 20_000,
  });

  const cancel = useMutation({
    mutationFn: (id: number) => bookingApi.updateStatus(id, 'CANCELLED'),
    onSuccess: () => {
      toast('Installation booking cancelled', 'info');
      void qc.invalidateQueries({ queryKey: ['my-bookings'] });
    },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  const installations = (data ?? []).filter((b) => b.serviceType === SPARE_PART_INSTALLATION);

  if (isLoading) return <CardSkeleton count={3} />;
  if (isError) return <ErrorState message="Could not load installations" onRetry={() => refetch()} />;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900 dark:text-ink-100">My Spare Part Installations</h1>
          <p className="mt-1 text-sm text-ink-500">Track your mechanic installation requests in real time.</p>
        </div>
        <Link to="/parts"><Button variant="outline">Browse Spare Parts</Button></Link>
      </div>

      {installations.length === 0 ? (
        <EmptyState
          icon={<Wrench className="h-6 w-6" />}
          title="No installations yet"
          description="Bought a spare part? Book a mechanic to install it for you."
          action={<Link to="/parts"><Button>Shop Spare Parts</Button></Link>}
        />
      ) : (
        <div className="space-y-4">
          {installations.map((b) => (
            <InstallationCard key={b.id} bookingId={b.id} expanded={expanded === b.id} onToggle={() => setExpanded(expanded === b.id ? null : b.id)} onCancel={() => cancel.mutate(b.id)} cancelling={cancel.isPending} onPay={() => navigate(`/dashboard/pay/${b.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}

function InstallationCard({
  bookingId,
  expanded,
  onToggle,
  onCancel,
  cancelling,
  onPay,
}: {
  bookingId: number;
  expanded: boolean;
  onToggle: () => void;
  onCancel: () => void;
  cancelling: boolean;
  onPay: () => void;
}) {
  const { data: booking } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: bookingApi.getMine,
    select: (list) => list.find((x) => x.id === bookingId),
  });
  const { data: part } = useQuery({
    queryKey: ['part', String(booking?.sparePartId ?? '')],
    queryFn: () => partsApi.get(Number(booking?.sparePartId)),
    enabled: !!booking?.sparePartId,
  });
  const { data: mechanic } = useQuery({
    queryKey: ['mechanic', booking?.mechanicId ?? -1],
    queryFn: () => mechanicApi.get(Number(booking?.mechanicId)),
    enabled: !!booking?.mechanicId,
  });

  if (!booking) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
      <button className="flex w-full flex-wrap items-center justify-between gap-3 p-5 text-left" onClick={onToggle}>
        <div className="flex items-center gap-3">
          {part && (
            <img src={partImageUrl(part.category, part.imageUrl)} alt={part.name} className="h-14 w-14 shrink-0 rounded-2xl object-cover" />
          )}
          <div>
            <p className="font-bold text-ink-900 dark:text-ink-100">{part?.name ?? `Spare part #${booking.sparePartId}`}</p>
            <p className="text-xs text-ink-400">#{booking.id} · {formatDateTime(booking.scheduledAt)}</p>
            <p className="mt-0.5 text-xs text-ink-500">
              {mechanic ? `👨‍🔧 ${mechanic.name}` : 'Mechanic assigned on booking'}
              {booking.sparePartOrderId ? ` · Order #${booking.sparePartOrderId}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="block text-sm font-bold text-ink-900 dark:text-ink-100">
              {formatCurrency(booking.finalAmount ?? booking.estimatedAmount)}
            </span>
            <span className="block text-[10px] uppercase tracking-wide text-ink-400">installation fee</span>
          </div>
          <StatusBadge kind="booking" status={booking.status} />
        </div>
      </button>

      {expanded && (
        <div className="grid gap-5 border-t border-ink-100 p-5 lg:grid-cols-2 dark:border-ink-800">
          <div>
            <div className="space-y-2 rounded-xl bg-ink-50 p-4 text-sm dark:bg-ink-800/50">
              <div className="flex justify-between text-ink-600 dark:text-ink-300">
                <span className="flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> Scheduled</span>
                <span className="font-semibold text-ink-900 dark:text-ink-100">{formatDateTime(booking.scheduledAt)}</span>
              </div>
              <div className="flex justify-between text-ink-600 dark:text-ink-300">
                <span>Address</span>
                <span className="max-w-[55%] truncate text-right font-semibold text-ink-900 dark:text-ink-100">{booking.address}</span>
              </div>
              {booking.status === 'PAID' && (
                <>
                  <div className="flex justify-between border-t border-ink-200 pt-2 text-ink-600 dark:border-ink-700 dark:text-ink-300">
                    <span>Platform commission</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">− {formatCurrency(booking.platformCommission)}</span>
                  </div>
                  <div className="flex justify-between text-ink-600 dark:text-ink-300">
                    <span>Mechanic earning</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(booking.mechanicEarning)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {booking.status === 'PENDING' && (
                <Button variant="danger" size="sm" onClick={onCancel} loading={cancelling}>
                  <XCircle className="h-4 w-4" /> Cancel Request
                </Button>
              )}
              {(booking.status === 'COMPLETED' || booking.status === 'PAYMENT_PENDING') && (
                <>
                  <Button size="sm" onClick={onPay}>
                    <CreditCard className="h-4 w-4" /> {booking.status === 'PAYMENT_PENDING' ? 'Retry Payment' : 'Pay Installation Fee'}
                  </Button>
                  <Link to="/dashboard/reviews"><Button variant="outline" size="sm"><Star className="h-4 w-4" /> Review Mechanic</Button></Link>
                </>
              )}
              {booking.status === 'PAID' && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                  ✓ Paid — {formatCurrency(booking.finalAmount ?? booking.estimatedAmount)}
                </span>
              )}
            </div>
          </div>
          <BookingTimeline bookingId={booking.id} currentStatus={booking.status} />
        </div>
      )}
    </motion.div>
  );
}
