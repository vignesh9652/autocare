import { useApiData } from '@/hooks/useApiData';
import { getDashboard, getAdminUsers } from '@/api/adminApi';
import ProfilePage from '@/pages/shared/ProfilePage';
import { formatCurrency } from '@/utils/format';

export default function AdminProfile() {
  const dashboard = useApiData(() => getDashboard(), []);
  const users = useApiData(() => getAdminUsers(), []);

  const d = dashboard.data;

  return (
    <ProfilePage
      roleLabel="Administrator"
      phone="Platform admin"
      location="Bengaluru HQ"
      stats={[
        { label: 'Platform Users', value: users.data?.length ?? 0 },
        { label: 'Total Mechanics', value: d?.totalMechanics ?? 0 },
        { label: 'Total Bookings', value: d?.totalBookings ?? 0 },
        { label: 'Total Revenue', value: formatCurrency(d?.totalRevenue ?? 0) },
      ]}
    />
  );
}
