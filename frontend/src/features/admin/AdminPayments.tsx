import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { AdminTable, StatusBadge } from './AdminTables';
import { BookingResponse, PaymentResponse, UserResponse } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';

/**
 * All transactions across the platform, enriched with the customer, mechanic
 * and the AutoCare commission / mechanic earning split (joined from the
 * booking, since those live on the booking rather than the payment).
 */
export function AdminPayments() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['admin-payments'], queryFn: adminApi.allPayments });
  const { data: bookings } = useQuery({ queryKey: ['admin-bookings'], queryFn: adminApi.allBookings });
  const { data: users } = useQuery({ queryKey: ['admin-users'], queryFn: adminApi.allUsers });
  const { data: mechanics } = useQuery({ queryKey: ['admin-mechanics'], queryFn: adminApi.allMechanics });

  const rows: PaymentResponse[] = (data ?? []) as PaymentResponse[];

  const bookingById = useMemo(() => {
    const map = new Map<number, BookingResponse>();
    for (const b of (bookings ?? []) as BookingResponse[]) map.set(b.id, b);
    return map;
  }, [bookings]);

  const userById = useMemo(() => {
    const map = new Map<number, UserResponse>();
    for (const u of (users ?? []) as UserResponse[]) map.set(u.id, u);
    return map;
  }, [users]);

  const mechanicById = useMemo(() => {
    const map = new Map<number, { name?: string }>();
    for (const m of (mechanics ?? []) as Array<{ id: number; name?: string }>) map.set(m.id, m);
    return map;
  }, [mechanics]);

  interface EnrichedPayment extends PaymentResponse {
    _booking?: BookingResponse;
    _customerName?: string;
    _mechanicName?: string;
  }

  const enrich = (p: PaymentResponse): EnrichedPayment => {
    if (p.referenceType !== 'BOOKING') return p;
    const booking = bookingById.get(p.referenceId);
    if (!booking) return p;
    return {
      ...p,
      // Attach booking context for the table cells (component-local extension)
      _booking: booking,
      _customerName: userById.get(booking.userId)?.name,
      _mechanicName: booking.mechanicId != null ? mechanicById.get(booking.mechanicId)?.name : undefined,
    };
  };

  const enriched: EnrichedPayment[] = rows.map(enrich);

  return (
    <AdminTable
      title="Payments"
      subtitle="All transactions across the platform — including the AutoCare commission and mechanic earning split."
      rows={enriched}
      isLoading={isLoading}
      isError={isError}
      onRetry={() => refetch()}
      searchPlaceholder="Search payments…"
      columns={[
        { header: '#', render: (r) => <span className="font-semibold text-ink-500">#{r.id}</span>, searchValue: (r) => String(r.id) },
        {
          header: 'Reference',
          render: (r) => (
            <span>
              <span className="font-semibold text-ink-900 dark:text-ink-100">{r.referenceType.replace('_', ' ')}</span>
              <span className="ml-1 text-xs text-ink-400">#{r.referenceId}</span>
            </span>
          ),
          searchValue: (r) => `${r.referenceType} ${r.referenceId}`,
        },
        { header: 'Customer', render: (r) => <span className="text-ink-700 dark:text-ink-300">{r._customerName ?? '—'}</span>, searchValue: (r) => r._customerName ?? '' },
        { header: 'Mechanic', render: (r) => <span className="text-ink-700 dark:text-ink-300">{r._mechanicName ?? '—'}</span>, searchValue: (r) => r._mechanicName ?? '' },
        { header: 'Amount', render: (r) => <span className="font-bold text-ink-900 dark:text-ink-100">{formatCurrency(r.amount)}</span> },
        {
          header: 'Commission',
          render: (r) => (
            <span className="font-medium text-amber-600 dark:text-amber-400">
              {r._booking?.platformCommission != null ? formatCurrency(r._booking.platformCommission) : '—'}
            </span>
          ),
        },
        {
          header: 'Mechanic Earning',
          render: (r) => (
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              {r._booking?.mechanicEarning != null ? formatCurrency(r._booking.mechanicEarning) : '—'}
            </span>
          ),
        },
        { header: 'Method', render: (r) => <span>{r.paymentMethod}</span>, searchValue: (r) => r.paymentMethod },
        { header: 'Txn ID', render: (r) => <span className="font-mono text-xs text-ink-500">{r.gatewayTransactionId.slice(0, 16)}…</span>, searchValue: (r) => r.gatewayTransactionId },
        { header: 'Status', render: (r) => <StatusBadge kind="payment" status={r.status} />, searchValue: (r) => r.status },
        { header: 'Date', render: (r) => <span className="text-ink-500">{formatDateTime(r.createdAt)}</span> },
      ]}
    />
  );
}
