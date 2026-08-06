import { useApiData } from '@/hooks/useApiData';
import { getVehicles } from '@/api/vehicleApi';
import { getBookings } from '@/api/bookingApi';
import { getPayments } from '@/api/paymentApi';
import ProfilePage from '@/pages/shared/ProfilePage';
import { formatCurrency } from '@/utils/format';

export default function CustomerProfile() {
  const vehicles = useApiData(() => getVehicles(), []);
  const bookings = useApiData(() => getBookings(), []);
  const payments = useApiData(() => getPayments(), []);

  const totalSpent = (payments.data ?? [])
    .filter((p) => p.status === 'SUCCESS')
    .reduce((s, p) => s + p.amount, 0);
  const allBookings = bookings.data ?? [];

  return (
    <ProfilePage
      roleLabel="Customer"
      phone="Registered"
      location="—"
      stats={[
        { label: 'Vehicles', value: vehicles.data?.length ?? 0 },
        { label: 'Total Bookings', value: allBookings.length },
        { label: 'Completed', value: allBookings.filter((b) => b.status === 'COMPLETED').length },
        { label: 'Total Spent', value: formatCurrency(totalSpent) },
      ]}
    />
  );
}
