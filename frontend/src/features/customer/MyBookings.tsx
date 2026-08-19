import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CalendarCheck, XCircle, CreditCard, MapPin, Star, Receipt, BadgeCheck, Wrench, Check, X, ShieldAlert } from 'lucide-react';
import { additionalServiceApi, bookingApi, mechanicApi, getErrorMessage } from '@/lib/api';
import { toast } from '@/stores/toast-store';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { BookingTimeline } from '@/features/booking/BookingTimeline';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/ui/Feedback';

const FILTERS = ['ALL', 'PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'PAYMENT_PENDING', 'PAID', 'CANCELLED'] as const;

export function MyBookings() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const focusId = Number(params.get('focus')) || null;
  const [filter, setFilter] = useState<string>('ALL');
  const [expanded, setExpanded] = useState<number | null>(focusId);

  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['my-bookings'], queryFn: bookingApi.getMine, refetchInterval: 20_000 });

  const cancel = useMutation({
    mutationFn: (id: number) => bookingApi.updateStatus(id, 'CANCELLED'),
    onSuccess: () => {
      toast('Booking cancelled', 'info');
      void qc.invalidateQueries({ queryKey: ['my-bookings'] });
    },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  const filtered = useMemo(() => (data ?? []).filter((b) => filter === 'ALL' || b.status === filter), [data, filter]);

  if (isLoading) return <CardSkeleton count={3} />;
  if (isError) return <ErrorState message="Could not load bookings" onRetry={() => refetch()} />;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900 dark:text-ink-100">My Bookings</h1>
          <p className="mt-1 text-sm text-ink-500">Track your service requests in real time.</p>
        </div>
        <Link to="/dashboard/book-service"><Button>+ New Booking</Button></Link>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              filter === f ? 'bg-ink-900 text-white dark:bg-white dark:text-ink-900' : 'bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300'
            }`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<CalendarCheck className="h-6 w-6" />} title="No bookings here" description="Book a doorstep service and track it live." action={<Link to="/dashboard/book-service"><Button>Book Service</Button></Link>} />
      ) : (
        <div className="space-y-4">
          {filtered.map((b) => (
            <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
              <button className="flex w-full flex-wrap items-center justify-between gap-3 p-5 text-left" onClick={() => setExpanded(expanded === b.id ? null : b.id)}>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-ink-900 dark:text-ink-100">{b.serviceType}</p>
                    <p className="text-xs text-ink-400">#{b.id} · {formatDateTime(b.scheduledAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    {b.finalAmount != null
                      ? <span className="block text-sm font-bold text-ink-900 dark:text-ink-100">{formatCurrency(b.finalAmount)}</span>
                      : b.estimatedAmount != null
                        ? <span className="block text-sm font-bold text-ink-900 dark:text-ink-100">{formatCurrency(b.estimatedAmount)}</span>
                        : null}
                    {b.estimatedAmount != null && b.finalAmount != null && (
                      <span className="block text-[10px] uppercase tracking-wide text-ink-400">est. {formatCurrency(b.estimatedAmount)}</span>
                    )}
                  </div>
                  <StatusBadge kind="booking" status={b.status} />
                </div>
              </button>

              {expanded === b.id && (
                <div className="grid gap-5 border-t border-ink-100 p-5 lg:grid-cols-2 dark:border-ink-800">
                  <div>
                    {b.mechanicId != null && <MechanicInfo mechanicId={b.mechanicId} />}
                    <p className="mb-1 text-xs font-semibold uppercase text-ink-400">Address</p>
                    <p className="text-sm text-ink-700 dark:text-ink-300">{b.address}</p>

                    {/* Additional services (vehicle inspection) — approval required */}
                    <AdditionalRequests bookingId={b.id} estimatedAmount={b.estimatedAmount} />

                    {/* Money summary */}
                    <div className="mt-4 space-y-1.5 rounded-xl bg-ink-50 p-4 text-sm dark:bg-ink-800/50">
                      <div className="flex justify-between text-ink-600 dark:text-ink-300">
                        <span>Estimated amount</span>
                        <span className="font-semibold text-ink-900 dark:text-ink-100">{formatCurrency(b.estimatedAmount)}</span>
                      </div>
                      {(b.additionalAmount != null && b.additionalAmount > 0) && (
                        <div className="flex justify-between text-ink-600 dark:text-ink-300">
                          <span>Approved additional services</span>
                          <span className="font-semibold text-ink-900 dark:text-ink-100">{formatCurrency(b.additionalAmount)}</span>
                        </div>
                      )}
                      {b.finalAmount != null && (
                        <div className="flex justify-between text-ink-600 dark:text-ink-300">
                          <span>Final amount (after inspection)</span>
                          <span className="font-semibold text-ink-900 dark:text-ink-100">{formatCurrency(b.finalAmount)}</span>
                        </div>
                      )}
                      {b.status === 'PAID' && (
                        <>
                          <div className="flex justify-between text-ink-600 dark:text-ink-300">
                            <span className="flex items-center gap-1"><Receipt className="h-3.5 w-3.5" /> AutoCare commission</span>
                            <span className="font-semibold text-amber-600 dark:text-amber-400">− {formatCurrency(b.platformCommission)}</span>
                          </div>
                          <div className="flex justify-between border-t border-ink-200 pt-1.5 dark:border-ink-700">
                            <span className="flex items-center gap-1"><BadgeCheck className="h-3.5 w-3.5 text-emerald-500" /> Mechanic earning</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(b.mechanicEarning)}</span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {b.status === 'PENDING' && (
                        <Button variant="danger" size="sm" onClick={() => cancel.mutate(b.id)} loading={cancel.isPending}>
                          <XCircle className="h-4 w-4" /> Cancel Booking
                        </Button>
                      )}
                      {(b.status === 'COMPLETED' || b.status === 'PAYMENT_PENDING') && (
                        <>
                          <Button size="sm" onClick={() => navigate(`/dashboard/pay/${b.id}`)}>
                            <CreditCard className="h-4 w-4" /> {b.status === 'PAYMENT_PENDING' ? 'Retry Payment' : 'Pay Now'}
                          </Button>
                          <Link to="/dashboard/reviews"><Button variant="outline" size="sm"><Star className="h-4 w-4" /> Review</Button></Link>
                        </>
                      )}
                      {b.status === 'PAID' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                          <BadgeCheck className="h-3.5 w-3.5" /> Paid — {formatCurrency(b.finalAmount ?? b.estimatedAmount)}
                        </span>
                      )}
                    </div>
                  </div>
                  <BookingTimeline bookingId={b.id} currentStatus={b.status} />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Additional-service requests for a booking. PENDING requests must be
 * approved or rejected by the customer before the mechanic can complete the
 * job — "no surprise billing".
 */
function AdditionalRequests({ bookingId, estimatedAmount }: { bookingId: number; estimatedAmount: number | null }) {
  const qc = useQueryClient();
  const { data: requests } = useQuery({
    queryKey: ['additional-services', bookingId],
    queryFn: () => additionalServiceApi.getByBooking(bookingId),
    refetchInterval: 15_000,
  });

  const decide = useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'approve' | 'reject' }) =>
      action === 'approve' ? additionalServiceApi.approve(id) : additionalServiceApi.reject(id),
    onSuccess: (_d, v) => {
      toast(v.action === 'approve' ? 'Additional service approved' : 'Additional service rejected', 'success');
      void qc.invalidateQueries({ queryKey: ['additional-services', bookingId] });
      void qc.invalidateQueries({ queryKey: ['my-bookings'] });
    },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  const list = requests ?? [];
  if (list.length === 0) return null;

  const base = estimatedAmount ?? 0;
  const approved = list.filter((r) => r.status === 'APPROVED').reduce((sum, r) => sum + r.amount, 0);
  const pendingSum = list.filter((r) => r.status === 'PENDING').reduce((sum, r) => sum + r.amount, 0);
  const projectedTotal = base + approved + pendingSum;
  const hasPending = list.some((r) => r.status === 'PENDING');

  return (
    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-500/25 dark:bg-amber-500/5">
      <div className="flex items-center gap-2">
        <Wrench className="h-4 w-4 text-brand-500" />
        <p className="text-sm font-bold text-ink-900 dark:text-ink-100">Recommended Additional Services</p>
      </div>

      {hasPending && (
        <p className="mt-2 flex items-start gap-1.5 text-[11px] font-medium leading-relaxed text-amber-700 dark:text-amber-300">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Your approval is required before this additional work is performed. Rejected services are never charged.
        </p>
      )}

      <div className="mt-3 space-y-2">
        {list.map((r) => (
          <div key={r.id} className="rounded-xl bg-white px-3 py-2.5 dark:bg-ink-800/60">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">{r.serviceName}</p>
                <p className="text-xs text-ink-500">{formatCurrency(r.amount)}{r.reason ? ` · ${r.reason}` : ''}</p>
              </div>
              <StatusBadge kind="additional" status={r.status} />
            </div>
            {r.status === 'PENDING' && (
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={() => decide.mutate({ id: r.id, action: 'approve' })} loading={decide.isPending}>
                  <Check className="h-4 w-4" /> Approve Additional Service
                </Button>
                <Button size="sm" variant="danger" onClick={() => decide.mutate({ id: r.id, action: 'reject' })}>
                  <X className="h-4 w-4" /> Reject
                </Button>
              </div>
            )}
            {r.status === 'APPROVED' && (
              <p className="mt-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Approved — the mechanic can now perform this service.</p>
            )}
            {r.status === 'REJECTED' && (
              <p className="mt-1.5 text-[11px] font-medium text-ink-400">Rejected — this service will not be performed or charged.</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 space-y-1 rounded-xl bg-white/70 p-3 text-xs dark:bg-ink-900/50">
        <div className="flex justify-between text-ink-600 dark:text-ink-300">
          <span>Original estimate</span>
          <span className="font-semibold">{formatCurrency(base)}</span>
        </div>
        {approved > 0 && (
          <div className="flex justify-between text-ink-600 dark:text-ink-300">
            <span>Approved additional</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">+ {formatCurrency(approved)}</span>
          </div>
        )}
        {hasPending && (
          <div className="flex justify-between text-ink-600 dark:text-ink-300">
            <span>Pending approval</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400">+ {formatCurrency(pendingSum)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-ink-200 pt-1.5 font-bold text-ink-900 dark:border-ink-700 dark:text-ink-100">
          <span>New estimated total</span>
          <span className="text-brand-600 dark:text-brand-400">{formatCurrency(projectedTotal)}</span>
        </div>
      </div>
    </div>
  );
}

function MechanicInfo({ mechanicId }: { mechanicId: number }) {
  const { data: mechanic } = useQuery({
    queryKey: ['mechanic', mechanicId],
    queryFn: () => mechanicApi.get(mechanicId),
  });
  if (!mechanic) return null;
  return (
    <div className="mb-3 flex items-center gap-3 rounded-xl bg-brand-50/70 p-3 dark:bg-brand-500/10">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-400">
        <Star className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">Your mechanic</p>
        <p className="truncate text-sm font-bold text-ink-900 dark:text-ink-100">{mechanic.name}</p>
        <p className="text-xs text-ink-500">⭐ {mechanic.averageRating?.toFixed(1) ?? 'New'} · {mechanic.totalJobsCompleted} jobs · {mechanic.serviceArea}</p>
      </div>
    </div>
  );
}
