import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getBookings, getAllBookings } from '@/api/bookingApi';
import { getPayments, getAllPayments } from '@/api/paymentApi';
import { buildNotifications } from '@/utils/apiMappers';
import type { AppNotification } from '@/types/dashboard';
import type { Booking } from '@/types';
import type { Payment } from '@/types';

/**
 * Builds the notification feed from real bookings + payments for the current
 * role. The backend has no notification endpoint, so notifications are derived
 * from real events the user owns (customer) or the whole platform (admin).
 * Mechanics have no bookable data of their own yet → an empty feed.
 */
export function useDerivedNotifications(): { items: AppNotification[]; loading: boolean } {
  const { user } = useAuth();
  const [state, setState] = useState<{ bookings: Booking[]; payments: Payment[] }>({
    bookings: [],
    payments: [],
  });
  const [loading, setLoading] = useState(true);

  const role = user?.role;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        if (role === 'ADMIN') {
          const [bookings, payments] = await Promise.all([getAllBookings(), getAllPayments()]);
          if (!cancelled) setState({ bookings, payments });
        } else if (role === 'CUSTOMER') {
          const [bookings, payments] = await Promise.all([getBookings(), getPayments()]);
          if (!cancelled) setState({ bookings, payments });
        } else {
          if (!cancelled) setState({ bookings: [], payments: [] });
        }
      } catch {
        if (!cancelled) setState({ bookings: [], payments: [] });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [role]);

  const items = useMemo(
    () => buildNotifications(state.bookings, state.payments),
    [state.bookings, state.payments],
  );

  return { items, loading };
}
