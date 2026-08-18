import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MapPin, Check, X, Play, CheckCircle2, Plus, Loader2, Wrench, Wrench as WrenchIcon } from 'lucide-react';
import { additionalServiceApi, bookingApi, getErrorMessage, serviceApi } from '@/lib/api';
import { toast } from '@/stores/toast-store';
import { BookingStatus, ServiceResponse, SPARE_PART_INSTALLATION } from '@/types';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/ui/Feedback';
import { formatCurrency, formatDateTime } from '@/lib/utils';

const FILTERS = [
  { key: 'all', label: 'All Jobs' },
  { key: 'installations', label: 'Spare Part Installations' },
] as const;

export function AssignedJobs() {
  const [params, setParams] = useSearchParams();
  const filter = params.get('type') === 'installations' ? 'installations' : 'all';

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['assigned-jobs'],
    queryFn: bookingApi.getAssigned,
    refetchInterval: 20_000,
  });

  if (isLoading) return <CardSkeleton count={3} />;
  if (isError) return <ErrorState message="Could not load jobs" onRetry={() => refetch()} />;

  const jobs = (data ?? []).filter(
    (j) => filter === 'all' || j.serviceType === SPARE_PART_INSTALLATION
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink-900 dark:text-ink-100">
          {filter === 'installations' ? 'Spare Part Installation Requests' : 'Assigned Jobs'}
        </h1>
        <p className="mt-1 text-sm text-ink-500">Accept, reject, inspect, and update the jobs assigned to you.</p>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setParams(f.key === 'all' ? {} : { type: f.key })}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              filter === f.key
                ? 'bg-ink-900 text-white dark:bg-white dark:text-ink-900'
                : 'bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300'
            }`}
          >
            {f.key === 'installations' && <WrenchIcon className="h-3.5 w-3.5" />}
            {f.label}
          </button>
        ))}
      </div>

      {jobs.length === 0 ? (
        <EmptyState
          icon={<MapPin className="h-6 w-6" />}
          title={filter === 'installations' ? 'No installation requests' : 'No assigned jobs'}
          description={
            filter === 'installations'
              ? 'New spare-part installation bookings will appear here automatically.'
              : 'New bookings in your area will appear here automatically.'
          }
        />
      ) : (
        <div className="space-y-4">
          {jobs.map((j) => (
            <JobCard key={j.id} job={j} />
          ))}
        </div>
      )}
    </div>
  );
}

function JobCard({ job: j }: { job: { id: number; serviceType: string; vehicleId: number; scheduledAt: string; address: string; status: BookingStatus; estimatedAmount: number | null; finalAmount: number | null; platformCommission: number | null; mechanicEarning: number | null } }) {
  const qc = useQueryClient();

  const update = useMutation({
    mutationFn: ({ id, status }: { id: number; status: BookingStatus }) => bookingApi.updateStatus(id, status),
    onSuccess: (_d, v) => {
      toast(`Job marked ${v.status.replace('_', ' ')}`, 'success');
      void qc.invalidateQueries({ queryKey: ['assigned-jobs'] });
    },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  // Shared with InspectionPanel — single cached query per booking.
  const { data: additionalRequests } = useQuery({
    queryKey: ['additional-services', j.id],
    queryFn: () => additionalServiceApi.getByBooking(j.id),
    enabled: j.status === 'IN_PROGRESS',
    refetchInterval: 15_000,
  });
  const hasPending = (additionalRequests ?? []).some((r) => r.status === 'PENDING');

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-ink-900 dark:text-ink-100">
              {j.serviceType === SPARE_PART_INSTALLATION ? 'Spare Part Installation' : j.serviceType}
            </p>
            <p className="text-xs text-ink-400">
              Booking #{j.id} · Vehicle #{j.vehicleId}
              {'sparePartId' in j && j.sparePartId ? ` · Part #${j.sparePartId}` : ''}
            </p>
            <p className="mt-1 text-xs text-ink-500">🕐 {formatDateTime(j.scheduledAt)}</p>
            <p className="mt-1 text-xs text-ink-500">📍 {j.address}</p>
          </div>
        </div>
        <StatusBadge kind="booking" status={j.status} />
      </div>

      {j.status === 'IN_PROGRESS' && <InspectionPanel bookingId={j.id} />}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-100 pt-4 dark:border-ink-800">
        {j.status === 'PENDING' && (
          <>
            <Button size="sm" onClick={() => update.mutate({ id: j.id, status: 'ACCEPTED' })} loading={update.isPending}>
              <Check className="h-4 w-4" /> Accept
            </Button>
            <Button variant="danger" size="sm" onClick={() => update.mutate({ id: j.id, status: 'REJECTED' })}>
              <X className="h-4 w-4" /> Reject
            </Button>
          </>
        )}
        {j.status === 'ACCEPTED' && (
          <Button size="sm" onClick={() => update.mutate({ id: j.id, status: 'IN_PROGRESS' })}>
            <Play className="h-4 w-4" /> Start Service
          </Button>
        )}
        {j.status === 'IN_PROGRESS' &&
          (hasPending ? (
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">⏳ Waiting for customer approval on additional service request(s)…</p>
          ) : (
            <Button size="sm" onClick={() => update.mutate({ id: j.id, status: 'COMPLETED' })} loading={update.isPending}>
              <CheckCircle2 className="h-4 w-4" /> Mark Completed
            </Button>
          ))}
        {j.status === 'COMPLETED' && (
          <div className="text-sm">
            <p className="font-semibold text-emerald-600 dark:text-emerald-400">✓ Job completed — awaiting customer payment</p>
            <p className="mt-0.5 text-xs text-ink-400">Final amount {formatCurrency(j.finalAmount ?? j.estimatedAmount)} · payout releases once paid</p>
          </div>
        )}
        {j.status === 'PAYMENT_PENDING' && (
          <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">⏳ Customer payment in progress</p>
        )}
        {j.status === 'PAID' && (
          <div className="rounded-xl bg-emerald-50 px-3 py-2 text-xs dark:bg-emerald-500/10">
            <p className="font-bold text-emerald-700 dark:text-emerald-400">✓ Paid — earnings credited</p>
            <p className="mt-1 text-ink-600 dark:text-ink-300">
              Service {formatCurrency(j.finalAmount ?? j.estimatedAmount)} ·
              AutoCare commission −{formatCurrency(j.platformCommission)} ·
              <span className="font-bold"> you earn {formatCurrency(j.mechanicEarning)}</span>
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Vehicle inspection: lists additional-service requests raised for this job
 * and lets the mechanic recommend a new one (priced from the platform
 * catalogue). The job cannot be completed until every request is decided.
 */
function InspectionPanel({ bookingId }: { bookingId: number }) {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [serviceId, setServiceId] = useState('');
  const [reason, setReason] = useState('');

  const { data: requests, isLoading } = useQuery({
    queryKey: ['additional-services', bookingId],
    queryFn: () => additionalServiceApi.getByBooking(bookingId),
    refetchInterval: 15_000,
  });
  const { data: catalog } = useQuery({
    queryKey: ['services-catalog'],
    queryFn: serviceApi.getAll,
    staleTime: 5 * 60 * 1000,
  });

  const create = useMutation({
    mutationFn: () => additionalServiceApi.create({ bookingId, serviceId: Number(serviceId), reason: reason.trim() }),
    onSuccess: (r) => {
      toast(`Approval request sent: ${r.serviceName} (${formatCurrency(r.amount)})`, 'success');
      setAdding(false);
      setServiceId('');
      setReason('');
      void qc.invalidateQueries({ queryKey: ['additional-services', bookingId] });
    },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  return (
    <div className="mt-4 rounded-2xl border border-ink-200 bg-ink-50/60 p-4 dark:border-ink-800 dark:bg-ink-900/40">
      <div className="flex items-center gap-2">
        <Wrench className="h-4 w-4 text-brand-500" />
        <p className="text-sm font-bold text-ink-900 dark:text-ink-100">Vehicle Inspection</p>
      </div>

      {isLoading ? (
        <p className="mt-2 text-xs text-ink-400">Loading additional services…</p>
      ) : (
        <div className="mt-3 space-y-2">
          {(requests ?? []).length === 0 ? (
            <p className="text-xs text-ink-500">No additional services recommended yet. Found extra work? Recommend a service below.</p>
          ) : (
            (requests ?? []).map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-3 py-2.5 dark:bg-ink-800/60">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">{r.serviceName}</p>
                  <p className="text-xs text-ink-500">{formatCurrency(r.amount)}{r.reason ? ` · ${r.reason}` : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge kind="additional" status={r.status} />
                </div>
                {r.status === 'PENDING' && (
                  <p className="w-full text-[11px] font-medium text-amber-600 dark:text-amber-400">Waiting for customer approval — do not perform yet.</p>
                )}
                {r.status === 'APPROVED' && (
                  <p className="w-full text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Approved — you can perform this service.</p>
                )}
                {r.status === 'REJECTED' && (
                  <p className="w-full text-[11px] font-medium text-red-500 dark:text-red-400">Rejected by customer — do not perform this service.</p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {!adding ? (
        <Button size="sm" variant="outline" className="mt-3" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" /> Add Additional Service
        </Button>
      ) : (
        <div className="mt-3 space-y-2 rounded-xl bg-white p-3 dark:bg-ink-800/60">
          <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="input" aria-label="Additional service">
            <option value="">Select a service from the catalogue…</option>
            {(catalog ?? []).map((s: ServiceResponse) => (
              <option key={s.id} value={s.id}>{s.serviceName} — {formatCurrency(s.basePrice)}</option>
            ))}
          </select>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason, e.g. Brake pads are worn out"
            aria-label="Reason for additional service"
            className="input"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => create.mutate()}
              disabled={!serviceId || !reason.trim()}
              loading={create.isPending}
            >
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Send Approval Request
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setServiceId(''); setReason(''); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
