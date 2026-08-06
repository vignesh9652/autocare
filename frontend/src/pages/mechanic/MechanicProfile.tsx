import { useAuth } from '@/context/AuthContext';
import { useApiData } from '@/hooks/useApiData';
import { getMechanics } from '@/api/mechanicApi';
import ProfilePage from '@/pages/shared/ProfilePage';

export default function MechanicProfile() {
  const { user } = useAuth();
  const mechanics = useApiData(() => getMechanics(), []);

  const mine =
    (mechanics.data ?? []).find((m) => m.email.toLowerCase() === (user?.email ?? '').toLowerCase()) ??
    (mechanics.data ?? [])[0];

  return (
    <ProfilePage
      roleLabel="Mechanic"
      phone={mine?.phone ?? 'Registered'}
      location={mine?.serviceArea ?? '—'}
      stats={[
        { label: 'Jobs Completed', value: mine?.totalJobsCompleted ?? 0 },
        { label: 'Avg. Rating', value: mine?.averageRating ? `${mine.averageRating.toFixed(1)} ★` : '—' },
        { label: 'Service Area', value: mine?.serviceArea ?? '—' },
        { label: 'Availability', value: mine?.availabilityStatus ?? '—' },
      ]}
    />
  );
}
