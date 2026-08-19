import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { AdminTable, StatusBadge } from './AdminTables';
import { Star } from 'lucide-react';

type Row = {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  serviceArea?: string;
  availabilityStatus?: string;
  averageRating?: number | null;
  totalJobsCompleted?: number;
};

export function AdminMechanics() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['admin-mechanics'], queryFn: adminApi.allMechanics });

  const rows: Row[] = (data ?? []) as Row[];

  return (
    <AdminTable
      title="Mechanics"
      subtitle="All registered and approved mechanics."
      rows={rows}
      isLoading={isLoading}
      isError={isError}
      onRetry={() => refetch()}
      searchPlaceholder="Search mechanics…"
      columns={[
        { header: 'Name', render: (r) => <span className="font-semibold text-ink-900 dark:text-ink-100">{r.name ?? '—'}</span>, searchValue: (r) => `${r.name ?? ''} ${r.email ?? ''}` },
        { header: 'Contact', render: (r) => <span className="text-ink-500">{r.phone ?? r.email ?? '—'}</span>, searchValue: (r) => `${r.phone ?? ''} ${r.email ?? ''}` },
        { header: 'Area', render: (r) => <span>{r.serviceArea ?? '—'}</span>, searchValue: (r) => r.serviceArea ?? '' },
        { header: 'Rating', render: (r) => (
            <span className="flex items-center gap-1 font-semibold text-ink-900 dark:text-ink-100">
              {r.averageRating ? <><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {r.averageRating.toFixed(1)}</> : '—'}
            </span>
          ) },
        { header: 'Jobs', render: (r) => <span>{r.totalJobsCompleted ?? 0}</span> },
        { header: 'Availability', render: (r) => <StatusBadge kind="availability" status={r.availabilityStatus ?? 'OFFLINE'} />, searchValue: (r) => r.availabilityStatus ?? '' },
      ]}
    />
  );
}
