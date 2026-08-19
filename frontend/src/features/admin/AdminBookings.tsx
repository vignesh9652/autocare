import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Wrench, User, RefreshCw } from 'lucide-react';
import { adminApi, bookingApi, getErrorMessage } from '@/lib/api';
import { toast } from '@/stores/toast-store';
import { AdminTable, StatusBadge } from './AdminTables';
import { BookingResponse, BookingStatus, MechanicResponse, UserResponse } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';

/**
 * Lifecycle-aware statuses an admin may drive a booking into from here.
 * Admin override exists in the backend, but offering only sensible next
 * steps keeps booking data consistent.
 */
const NEXT_STATUS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
  ACCEPTED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: [],
  PAYMENT_PENDING: [],
  PAID: [],
  REJECTED: [],
  CANCELLED: [],
};

export function AdminBookings() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['admin-bookings'], queryFn: adminApi.allBookings });
  const { data: mechanics } = useQuery({ queryKey: ['admin-mechanics'], queryFn: adminApi.allMechanics });
  const { data: users } = useQuery({ queryKey: ['admin-users'], queryFn: adminApi.allUsers });

  const update = useMutation({
    mutationFn: ({ id, status }: { id: number; status: BookingStatus }) => bookingApi.updateStatus(id, status),
    onSuccess: (_d, v) => {
      toast(`Booking #${v.id} → ${v.status.replaceAll('_', ' ')}`, 'success');
      void qc.invalidateQueries({ queryKey: ['admin-bookings'] });
    },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  const rows: BookingResponse[] = (data ?? []) as BookingResponse[];

  // id → name lookups so the table shows real names instead of raw ids
  const mechanicNames = useMemo(() => {
    const map = new Map<number, string>();
    for (const m of (mechanics ?? []) as Array<MechanicResponse & Record<string, unknown>>) {
      if (m?.id != null && m.name) map.set(m.id, m.name);
    }
    return map;
  }, [mechanics]);

  const userNames = useMemo(() => {
    const map = new Map<number, string>();
    for (const u of (users ?? []) as UserResponse[]) {
      if (u?.id != null && u.name) map.set(u.id, u.name);
    }
    return map;
  }, [users]);

  return (
    <AdminTable
      title="All Bookings"
      subtitle="Every service request — including customer-chosen mechanics."
      rows={rows}
      isLoading={isLoading}
      isError={isError}
      onRetry={() => refetch()}
      searchPlaceholder="Search bookings…"
      columns={[
        { header: '#', render: (r) => <span className="font-semibold text-ink-500">#{r.id}</span>, searchValue: (r) => String(r.id) },
        { header: 'Service', render: (r) => <span className="font-semibold text-ink-900 dark:text-ink-100">{r.serviceType}</span>, searchValue: (r) => r.serviceType },
        {
          header: 'Customer',
          render: (r) => (
            <span className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-300">
                <User className="h-3.5 w-3.5" />
              </span>
              <span>
                <span className="block font-medium text-ink-900 dark:text-ink-100">{userNames.get(r.userId) ?? `User #${r.userId}`}</span>
                <span className="block text-[11px] text-ink-400">id {r.userId}</span>
              </span>
            </span>
          ),
          searchValue: (r) => `${userNames.get(r.userId) ?? ''} ${r.userId}`,
        },
        {
          header: 'Mechanic',
          render: (r) =>
            r.mechanicId ? (
              <span className="flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                  <Wrench className="h-3.5 w-3.5" />
                </span>
                <span>
                  <span className="block font-medium text-ink-900 dark:text-ink-100">{mechanicNames.get(r.mechanicId) ?? `Mechanic #${r.mechanicId}`}</span>
                  <span className="block text-[11px] text-ink-400">id {r.mechanicId}</span>
                </span>
              </span>
            ) : (
              <span className="text-ink-300 dark:text-ink-600">—</span>
            ),
          searchValue: (r) => `${mechanicNames.get(r.mechanicId ?? 0) ?? ''} ${r.mechanicId ?? ''}`,
        },
        {
          header: 'Estimate',
          render: (r) => <span className="font-bold text-ink-900 dark:text-ink-100">{formatCurrency(r.estimatedAmount)}</span>,
          searchValue: (r) => String(r.estimatedAmount ?? ''),
        },
        {
          header: 'Final',
          render: (r) => (
            <span className="font-semibold text-ink-900 dark:text-ink-100">
              {r.finalAmount != null ? formatCurrency(r.finalAmount) : <span className="text-ink-300 dark:text-ink-600">—</span>}
            </span>
          ),
        },
        {
          header: 'Commission',
          render: (r) => (
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              {r.platformCommission != null ? formatCurrency(r.platformCommission) : <span className="text-ink-300 dark:text-ink-600">—</span>}
            </span>
          ),
        },
        {
          header: 'Mechanic Earning',
          render: (r) => (
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {r.mechanicEarning != null ? formatCurrency(r.mechanicEarning) : <span className="text-ink-300 dark:text-ink-600">—</span>}
            </span>
          ),
        },
        { header: 'Scheduled', render: (r) => <span className="text-ink-500">{formatDateTime(r.scheduledAt)}</span>, searchValue: (r) => r.scheduledAt },
        { header: 'Status', render: (r) => <StatusBadge kind="booking" status={r.status} />, searchValue: (r) => r.status },
        {
          header: 'Manage',
          render: (r) => {
            const options = NEXT_STATUS[r.status] ?? [];
            if (options.length === 0) {
              return <span className="text-xs text-ink-300 dark:text-ink-600">—</span>;
            }
            const isUpdating = update.isPending && update.variables?.id === r.id;
            return (
              <div className="flex items-center gap-1">
                <select
                  aria-label={`Set status for booking ${r.id}`}
                  className="input h-8 w-auto py-1 pr-7 text-xs"
                  value=""
                  disabled={isUpdating}
                  onChange={(e) => {
                    const status = e.target.value as BookingStatus;
                    if (!status) return;
                    if (status === 'CANCELLED' && !window.confirm(`Cancel booking #${r.id}? This cannot be undone.`)) {
                      e.target.value = '';
                      return;
                    }
                    update.mutate({ id: r.id, status });
                  }}
                >
                  <option value="" disabled>Set status…</option>
                  {options.map((s) => (
                    <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>
                  ))}
                </select>
                {isUpdating && <RefreshCw className="h-3.5 w-3.5 animate-spin text-brand-500" />}
              </div>
            );
          },
        },
      ]}
    />
  );
}
