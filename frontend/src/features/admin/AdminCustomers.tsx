import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { AdminTable, StatusBadge } from './AdminTables';
import { UserResponse } from '@/types';
import { formatDate } from '@/lib/utils';

export function AdminCustomers() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['admin-users'], queryFn: adminApi.allUsers });

  const rows = ((data ?? []) as UserResponse[]).filter((u) => u.role === 'CUSTOMER');

  return (
    <AdminTable
      title="Customers"
      subtitle="All registered customers."
      rows={rows}
      isLoading={isLoading}
      isError={isError}
      onRetry={() => refetch()}
      searchPlaceholder="Search customers…"
      columns={[
        { header: 'Name', render: (r) => <span className="font-semibold text-ink-900 dark:text-ink-100">{r.name}</span>, searchValue: (r) => `${r.name} ${r.email}` },
        { header: 'Email', render: (r) => <span className="text-ink-500">{r.email}</span>, searchValue: (r) => r.email },
        { header: 'Phone', render: (r) => <span>{r.phone ?? '—'}</span>, searchValue: (r) => r.phone ?? '' },
        { header: 'Status', render: (r) => <StatusBadge kind="account" status={r.status} />, searchValue: (r) => r.status },
        { header: 'Joined', render: (r) => <span className="text-ink-500">{formatDate(r.createdAt)}</span> },
      ]}
    />
  );
}
