import { useState } from 'react';
import { Eye, Users } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Badge, { type BadgeVariant } from '@/components/ui/Badge';
import Modal from '@/components/Modal';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import Skeleton from '@/components/ui/Skeleton';
import Avatar from '@/components/ui/Avatar';
import { useApiData } from '@/hooks/useApiData';
import { getAdminUsers } from '@/api/adminApi';
import type { User } from '@/types';
import { formatDateTime } from '@/utils/format';

const ROLE_VARIANT: Record<User['role'], BadgeVariant> = {
  CUSTOMER: 'success',
  MECHANIC: 'info',
  ADMIN: 'danger',
};

export default function AdminCustomers() {
  const users = useApiData(() => getAdminUsers(), []);
  const [viewing, setViewing] = useState<User | null>(null);

  const customers = (users.data ?? []).filter((u) => u.role === 'CUSTOMER');

  const columns: DataTableColumn<User>[] = [
    { key: 'name', header: 'User', render: (u) => (
      <div className="flex items-center gap-3">
        <Avatar name={u.name} size="sm" />
        <div>
          <p className="font-medium text-slate-800 dark:text-slate-100">{u.name}</p>
          <p className="text-xs text-slate-400">#{u.id}</p>
        </div>
      </div>
    ) },
    { key: 'email', header: 'Email', hideBelow: 'md', render: (u) => <span className="text-slate-600 dark:text-slate-300">{u.email}</span> },
    { key: 'phone', header: 'Phone', hideBelow: 'lg', render: (u) => <span className="text-slate-500 dark:text-slate-400">{u.phone || '—'}</span> },
    { key: 'role', header: 'Role', render: (u) => <Badge variant={ROLE_VARIANT[u.role]}>{u.role}</Badge> },
    { key: 'joined', header: 'Joined', hideBelow: 'lg', render: (u) => <span className="whitespace-nowrap text-slate-500 dark:text-slate-400">{formatDateTime(u.createdAt)}</span> },
    { key: 'actions', header: 'Actions', render: (u) => (
      <div className="flex items-center gap-1">
        <button onClick={() => setViewing(u)} className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800 dark:hover:text-brand-400" title="View">
          <Eye className="h-4 w-4" />
        </button>
      </div>
    ) },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Customer Management"
        subtitle={`${customers.length} registered customers`}
        icon={<Users className="h-5 w-5" />}
      />

      {users.loading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <DataTable
          columns={columns}
          data={customers}
          rowKey={(u) => u.id}
          searchable
          searchPlaceholder="Search by name, email or phone…"
          searchFilter={(u, q) => [u.name, u.email, u.phone].some((v) => v.toLowerCase().includes(q))}
          emptyTitle="No customers found"
          emptyDescription="Registered customers will appear here."
        />
      )}

      {/* View modal */}
      <Modal open={Boolean(viewing)} title={viewing?.name ?? ''} onClose={() => setViewing(null)} maxWidth="max-w-md">
        {viewing && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <Avatar name={viewing.name} size="lg" />
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">{viewing.email}</p>
                <p className="text-xs text-slate-400">{viewing.phone || 'No phone'} · Joined {formatDateTime(viewing.createdAt)}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                ['User ID', viewing.id],
                ['Role', viewing.role],
                ['Status', 'ACTIVE'],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/60">
                  <p className="text-[11px] text-slate-400">{k}</p>
                  <p className="mt-0.5 font-bold text-slate-800 dark:text-slate-100">{v}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
