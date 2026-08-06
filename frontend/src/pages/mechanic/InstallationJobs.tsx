import { useMemo, useState } from 'react';
import {
  CalendarDays,
  Check,
  ClipboardList,
  Clock3,
  MapPin,
  PackageCheck,
  Phone,
  User,
  Wrench,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import OrderTimeline from '@/components/marketplace/OrderTimeline';
import PartVisual from '@/components/marketplace/PartVisual';
import { useOrders } from '@/context/MarketplaceStore';
import { useToast } from '@/components/ui/Toast';
import { useApiData } from '@/hooks/useApiData';
import { getParts } from '@/api/sparePartsApi';
import { toMarketplacePart } from '@/utils/apiMappers';
import { currentStepKey } from '@/utils/marketplace';
import { formatCurrency, formatDate } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { MarketplaceOrder } from '@/types';

/** The mechanic whose installation jobs this dashboard shows. */
const DEMO_MECHANIC = 'Arun Prakash';

type JobStage = 'upcoming' | 'pending' | 'active' | 'done';
type JobFilter = 'all' | JobStage;

function jobStage(order: MarketplaceOrder): JobStage {
  const key = currentStepKey(order.timeline);
  if (key === 'waiting-mechanic') return 'pending';
  if (key === 'mechanic-assigned' || key === 'installed') return 'active';
  if (key === 'rating' || key === 'complete') return 'done';
  // Order placed → part delivered: not yet ready for the mechanic.
  return 'upcoming';
}

/** Mechanic-controlled timeline transitions, keyed by the current step. */
const STAGE_ACTIONS: Record<string, { label: string; next: string } | undefined> = {
  'waiting-mechanic': { label: 'Accept Job', next: 'mechanic-assigned' },
  'mechanic-assigned': { label: 'Mark Installation Completed', next: 'installed' },
};

const STAGE_META: Record<JobStage, { variant: 'warning' | 'info' | 'success' | 'neutral'; label: string }> = {
  upcoming: { variant: 'neutral', label: 'Awaiting delivery' },
  pending: { variant: 'warning', label: 'Awaiting acceptance' },
  active: { variant: 'info', label: 'In progress' },
  done: { variant: 'success', label: 'Completed' },
};

export default function InstallationJobs() {
  const { orders, updateOrderStatus } = useOrders();
  const { success, info } = useToast();
  const catalog = useApiData(() => getParts(), []);
  const [filter, setFilter] = useState<JobFilter>('all');
  const [viewing, setViewing] = useState<MarketplaceOrder | null>(null);

  const partById = useMemo(() => {
    const map = new Map<number, ReturnType<typeof toMarketplacePart>>();
    for (const p of catalog.data ?? []) map.set(p.id, toMarketplacePart(p));
    return map;
  }, [catalog.data]);

  const viewingPart = viewing ? partById.get(viewing.lines[0]?.partId ?? -1) : undefined;
  const modalAction = viewing ? STAGE_ACTIONS[currentStepKey(viewing.timeline)] : undefined;

  const jobs = useMemo(
    () =>
      orders
        .filter((o) => o.mode === 'MECHANIC' && o.mechanic?.name === DEMO_MECHANIC)
        .sort((a, b) => {
          const rank = { upcoming: -1, pending: 0, active: 1, done: 2 } as const;
          return rank[jobStage(a)] - rank[jobStage(b)] ||
            (a.placedAt < b.placedAt ? 1 : -1);
        }),
    [orders],
  );

  const filtered = useMemo(
    () => jobs.filter((o) => filter === 'all' || jobStage(o) === filter),
    [jobs, filter],
  );

  const counts = useMemo(
    () => ({
      upcoming: jobs.filter((o) => jobStage(o) === 'upcoming').length,
      pending: jobs.filter((o) => jobStage(o) === 'pending').length,
      active: jobs.filter((o) => jobStage(o) === 'active').length,
      done: jobs.filter((o) => jobStage(o) === 'done').length,
    }),
    [jobs],
  );

  const runAction = (order: MarketplaceOrder, action: { label: string; next: string }) => {
    updateOrderStatus(order.id, action.next);
    if (action.next === 'mechanic-assigned') {
      success('Job accepted', `${order.id} — you're confirmed for ${formatDate(order.mechanic?.date ?? '')}.`);
    } else {
      success('Installation marked complete', `${order.id} — the customer will confirm and rate.`);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Installation Jobs"
        subtitle="Spare part installations assigned to you — accept jobs and keep customers updated"
        icon={<Wrench className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="warning" dot>{counts.pending} to accept</Badge>
            <Badge variant="info" dot>{counts.active} in progress</Badge>
          </div>
        }
      />

      {/* Filters */}
      <div className="mb-5 flex flex-wrap gap-1.5">
        {(
          [
            { key: 'all', label: 'All jobs' },
            { key: 'upcoming', label: `Awaiting delivery (${counts.upcoming})` },
            { key: 'pending', label: `Awaiting acceptance (${counts.pending})` },
            { key: 'active', label: `In progress (${counts.active})` },
            { key: 'done', label: `Completed (${counts.done})` },
          ] as { key: JobFilter; label: string }[]
        ).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all',
              filter === f.key
                ? 'border-transparent bg-gradient-to-r from-brand-600 to-sky-500 text-white shadow-md shadow-brand-600/20'
                : 'border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-brand-500/50 dark:hover:text-brand-400',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<PackageCheck className="h-9 w-9" />}
            title="No installation jobs here"
            description="When a customer books you to install a spare part, the job will appear here for you to accept and track."
          />
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => {
            const stage = jobStage(order);
            const meta = STAGE_META[stage];
            const action = STAGE_ACTIONS[currentStepKey(order.timeline)];
            const progressDone = order.timeline.filter((s) => s.done || s.current).length;
            const progressTotal = order.timeline.length;
            const part = partById.get(order.lines[0]?.partId ?? -1);

            return (
              <div key={order.id} className="card overflow-hidden">
                <div className="flex flex-wrap items-center gap-4 p-5">
                  {part ? (
                    <PartVisual part={part} className="h-16 w-16 shrink-0 rounded-xl" iconClassName="h-8 w-8" />
                  ) : (
                    <span className="h-16 w-16 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800" />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white">{order.id}</p>
                      <Badge variant={meta.variant} dot>{meta.label}</Badge>
                      {order.mechanic?.homeService ? (
                        <Badge variant="neutral" dot>Home service</Badge>
                      ) : (
                        <Badge variant="neutral">Workshop</Badge>
                      )}
                    </div>
                    <p className="mt-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {order.lines.map((l) => l.name).join(', ')}
                      <span className="font-normal text-slate-400"> · {order.lines[0]?.brand}</span>
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" /> {order.customerName || 'Customer'}
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {order.mechanic?.date} at {order.mechanic?.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {order.address}
                      </span>
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-4">
                    {/* Mini progress */}
                    <div className="hidden w-28 sm:block">
                      <div className="mb-1 flex justify-between text-[10px] font-semibold text-slate-400">
                        <span>Progress</span>
                        <span>{progressDone}/{progressTotal}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-600 to-sky-500"
                          style={{ width: `${(progressDone / Math.max(1, progressTotal)) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      {action ? (
                        <Button size="sm" className="w-full" onClick={() => runAction(order, action)}>
                          <Check className="h-3.5 w-3.5" /> {action.label}
                        </Button>
                      ) : stage === 'done' ? (
                        <Badge variant="success" dot className="justify-center">Order Complete</Badge>
                      ) : stage === 'pending' ? (
                        <Badge variant="warning" dot className="justify-center">Awaiting acceptance</Badge>
                      ) : stage === 'active' ? (
                        <Badge variant="info" dot className="justify-center">Awaiting customer rating</Badge>
                      ) : (
                        <Badge variant="neutral" dot className="justify-center">Part not delivered yet</Badge>
                      )}
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" className="flex-1" onClick={() => setViewing(order)}>
                          <ClipboardList className="h-3.5 w-3.5" /> Details
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1"
                          onClick={() => info('Calling customer', `Connecting you to ${order.customerName || 'the customer'}…`)}
                        >
                          <Phone className="h-3.5 w-3.5" /> Call
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Job detail modal */}
      <Modal
        open={viewing !== null}
        onClose={() => setViewing(null)}
        title={viewing ? `Job ${viewing.id}` : 'Job'}
        maxWidth="max-w-xl"
      >
        {viewing && (
          <div className="space-y-5">
            {/* Customer & slot */}
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60">
              <Avatar name={viewing.customerName || 'Customer'} size="md" />
              <div className="min-w-0 flex-1 text-xs">
                <p className="font-bold text-slate-800 dark:text-slate-100">
                  {viewing.customerName || 'Customer'}
                </p>
                <p className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <MapPin className="h-3 w-3" /> {viewing.address}
                </p>
              </div>
              <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                <p className="flex items-center justify-end gap-1">
                  <CalendarDays className="h-3 w-3" /> {viewing.mechanic?.date}
                </p>
                <p className="mt-0.5 flex items-center justify-end gap-1">
                  <Clock3 className="h-3 w-3" /> {viewing.mechanic?.time}
                </p>
              </div>
            </div>

            {/* Part */}
            <div className="flex items-center gap-3">
              {viewingPart && (
                <PartVisual part={viewingPart} className="h-14 w-14 shrink-0 rounded-xl" iconClassName="h-7 w-7" />
              )}
              <div className="min-w-0 flex-1 text-xs">
                <p className="font-bold text-slate-800 dark:text-slate-100">
                  {viewing.lines.map((l) => l.name).join(', ')}
                </p>
                <p className="text-slate-400">
                  {viewing.lines.map((l) => `${l.brand} · Qty ${l.quantity}`).join(' · ')}
                </p>
              </div>
              <div className="shrink-0 text-right text-xs">
                <p className="font-bold text-slate-800 dark:text-slate-100">
                  {formatCurrency(viewing.total)}
                </p>
                <p className="text-slate-400">{viewing.paymentMethod}</p>
              </div>
            </div>

            {/* Charges */}
            <div className="space-y-1.5 rounded-xl border border-slate-200 p-3.5 text-xs dark:border-slate-700">
              <p className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Installation charge</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {formatCurrency(viewing.mechanicCharge)}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Mode</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {viewing.mechanic?.homeService ? 'Home service' : 'Workshop'}
                </span>
              </p>
            </div>

            {/* Timeline */}
            <div>
              <p className="label">Job status</p>
              <OrderTimeline steps={viewing.timeline} />
            </div>

            {/* Action in modal */}
            {modalAction && (
              <Button
                className="w-full"
                onClick={() => {
                  runAction(viewing, modalAction);
                  setViewing(null);
                }}
              >
                <Check className="h-4 w-4" /> {modalAction.label}
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
