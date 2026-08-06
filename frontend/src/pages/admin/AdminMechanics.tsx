import { useState } from 'react';
import { Check, Eye, Wrench, X } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/Modal';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import Skeleton from '@/components/ui/Skeleton';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { useApiData } from '@/hooks/useApiData';
import {
  approveMechanic,
  getAdminMechanics,
  getPendingMechanics,
  rejectMechanic,
} from '@/api/adminApi';
import type { User } from '@/types';
import { availabilityVariant } from '@/utils/status';
import { formatDate } from '@/utils/format';

interface AdminMechanicRow {
  id: number;
  name: string;
  phone: string;
  email: string;
  skills: string[];
  serviceArea: string;
  availabilityStatus: string;
  averageRating: number | null;
  totalJobsCompleted: number;
}

function toRow(raw: Record<string, unknown>): AdminMechanicRow {
  return {
    id: Number(raw.id ?? 0),
    name: String(raw.name ?? '—'),
    phone: String(raw.phone ?? ''),
    email: String(raw.email ?? ''),
    skills: Array.isArray(raw.skills) ? (raw.skills as string[]) : [],
    serviceArea: String(raw.serviceArea ?? ''),
    availabilityStatus: String(raw.availabilityStatus ?? 'AVAILABLE'),
    averageRating: typeof raw.averageRating === 'number' ? raw.averageRating : null,
    totalJobsCompleted: Number(raw.totalJobsCompleted ?? 0),
  };
}

export default function AdminMechanics() {
  const mechanics = useApiData(() => getAdminMechanics(), []);
  const pending = useApiData(() => getPendingMechanics(), []);
  const [viewing, setViewing] = useState<AdminMechanicRow | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const { success, error } = useToast();

  const rows = (mechanics.data ?? []).map(toRow);
  const pendingUsers = pending.data ?? [];

  const decide = async (u: User, action: 'approve' | 'reject') => {
    setBusyId(u.id);
    try {
      if (action === 'approve') {
        await approveMechanic(u.id);
        success('Mechanic approved', `${u.name} can now sign in and accept jobs.`);
      } else {
        await rejectMechanic(u.id);
        success('Application rejected', `${u.name}'s account stays blocked.`);
      }
      pending.refresh();
      mechanics.refresh();
    } catch (err) {
      error('Action failed', 'Could not update the application. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const columns: DataTableColumn<AdminMechanicRow>[] = [
    { key: 'name', header: 'Mechanic', render: (m) => (
      <div className="flex items-center gap-3">
        <Avatar name={m.name} size="sm" />
        <div>
          <p className="font-medium text-slate-800 dark:text-slate-100">{m.name}</p>
          <p className="text-xs text-slate-400">#{m.id}</p>
        </div>
      </div>
    ) },
    { key: 'skills', header: 'Skills', hideBelow: 'md', render: (m) => (
      <div className="flex flex-wrap gap-1">
        {m.skills.map((s) => (
          <span key={s} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{s}</span>
        ))}
      </div>
    ) },
    { key: 'rating', header: 'Rating', render: (m) => (
      <span className="font-bold text-amber-500">★ {m.averageRating !== null ? m.averageRating.toFixed(1) : '—'}</span>
    ) },
    { key: 'jobs', header: 'Jobs', hideBelow: 'lg', render: (m) => <span className="text-slate-600 dark:text-slate-300">{m.totalJobsCompleted}</span> },
    { key: 'area', header: 'Service Area', hideBelow: 'lg', render: (m) => <span className="text-slate-600 dark:text-slate-300">{m.serviceArea}</span> },
    { key: 'availability', header: 'Availability', render: (m) => <Badge variant={availabilityVariant(m.availabilityStatus)} dot>{m.availabilityStatus.replace('_', ' ')}</Badge> },
    { key: 'actions', header: 'Actions', render: (m) => (
      <div className="flex items-center gap-1">
        <button onClick={() => setViewing(m)} className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800 dark:hover:text-brand-400" title="View">
          <Eye className="h-4 w-4" />
        </button>
      </div>
    ) },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Mechanic Management"
        subtitle={`${rows.length} registered mechanics · ${pendingUsers.length} awaiting approval`}
        icon={<Wrench className="h-5 w-5" />}
      />

      {/* Pending approvals */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            Pending Approvals
            {pendingUsers.length > 0 && <Badge variant="warning" dot>{pendingUsers.length}</Badge>}
          </h3>
          <span className="text-xs text-slate-400">Mechanic applications awaiting your review</span>
        </div>

        {pending.loading ? (
          <Skeleton className="h-28 w-full" />
        ) : pendingUsers.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<Wrench className="h-8 w-8" />}
              title="No pending applications"
              description="When a mechanic applies, their registration lands here for you to approve or reject."
            />
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {pendingUsers.map((u) => (
              <div key={u.id} className="card flex items-center gap-4 p-4">
                <Avatar name={u.name} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{u.name}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {u.phone || 'No phone'} · applied {u.createdAt ? formatDate(u.createdAt.slice(0, 10)) : 'recently'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => decide(u, 'approve')}
                    disabled={busyId === u.id}
                    className="flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50 dark:bg-emerald-500/15 dark:text-emerald-400 dark:hover:bg-emerald-500/25"
                    title="Approve application"
                  >
                    <Check className="h-3.5 w-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => decide(u, 'reject')}
                    disabled={busyId === u.id}
                    className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50 dark:bg-red-500/15 dark:text-red-400 dark:hover:bg-red-500/25"
                    title="Reject application"
                  >
                    <X className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {mechanics.loading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          rowKey={(m) => m.id}
          searchable
          searchPlaceholder="Search mechanics…"
          searchFilter={(m, q) => [m.name, ...m.skills, m.serviceArea].some((v) => v.toLowerCase().includes(q))}
          emptyTitle="No mechanics found"
          emptyDescription="Registered mechanics will appear here."
        />
      )}

      <Modal open={Boolean(viewing)} title={viewing?.name ?? ''} onClose={() => setViewing(null)} maxWidth="max-w-md">
        {viewing && (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['Email', viewing.email],
              ['Phone', viewing.phone || '—'],
              ['Service area', viewing.serviceArea],
              ['Availability', viewing.availabilityStatus.replace('_', ' ')],
              ['Avg. rating', viewing.averageRating !== null ? `${viewing.averageRating.toFixed(1)} ★` : '—'],
              ['Jobs completed', viewing.totalJobsCompleted],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                <dt className="text-xs font-medium text-slate-400 dark:text-slate-500">{k}</dt>
                <dd className="mt-0.5 font-semibold text-slate-800 dark:text-slate-100">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </Modal>
    </div>
  );
}
