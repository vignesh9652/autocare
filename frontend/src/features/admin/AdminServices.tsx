import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Pencil, Plus, Percent, Save, X } from 'lucide-react';
import { serviceApi, getErrorMessage } from '@/lib/api';
import { toast } from '@/stores/toast-store';
import { AdminTable } from './AdminTables';
import { ServiceResponse } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { CardSkeleton } from '@/components/ui/Feedback';

export function AdminServices() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['admin-services'], queryFn: serviceApi.getAllAdmin });
  const { data: config, refetch: refetchConfig } = useQuery({ queryKey: ['admin-commission'], queryFn: serviceApi.getCommissionConfig });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [priceDraft, setPriceDraft] = useState('');
  const [newService, setNewService] = useState({ serviceName: '', description: '', basePrice: '' });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { serviceName: string; description?: string; basePrice: number; active?: boolean } }) =>
      serviceApi.update(id, data),
    onSuccess: () => {
      toast('Service price updated', 'success');
      setEditingId(null);
      void qc.invalidateQueries({ queryKey: ['admin-services'] });
    },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => {
      const svc = (data ?? []).find((s) => s.id === id);
      return serviceApi.update(id, {
        serviceName: svc?.serviceName ?? '',
        description: svc?.description ?? '',
        basePrice: svc?.basePrice ?? 0,
        active,
      });
    },
    onSuccess: (_d, v) => {
      toast(`Service ${v.active ? 'activated' : 'deactivated'}`, 'success');
      void qc.invalidateQueries({ queryKey: ['admin-services'] });
    },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  const create = useMutation({
    mutationFn: () =>
      serviceApi.create({
        serviceName: newService.serviceName.trim(),
        description: newService.description.trim() || undefined,
        basePrice: Number(newService.basePrice),
        active: true,
      }),
    onSuccess: () => {
      toast('Service added to catalogue', 'success');
      setNewService({ serviceName: '', description: '', basePrice: '' });
      void qc.invalidateQueries({ queryKey: ['admin-services'] });
    },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  const updateCommission = useMutation({
    mutationFn: (percentage: number) => serviceApi.updateCommissionConfig(percentage),
    onSuccess: (_d, pct) => {
      toast(`Platform commission set to ${pct}%`, 'success');
      void refetchConfig();
    },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  const [commissionDraft, setCommissionDraft] = useState<string>('');

  const rows: ServiceResponse[] = (data ?? []) as ServiceResponse[];

  const canAdd = useMemo(
    () => newService.serviceName.trim().length > 0 && Number(newService.basePrice) >= 0 && newService.basePrice !== '',
    [newService]
  );

  if (isLoading) return <CardSkeleton count={3} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink-900 dark:text-ink-100">Services & Pricing</h1>
        <p className="mt-1 text-sm text-ink-500">Platform-controlled service prices — customers and mechanics can only view these.</p>
      </div>

      {/* Commission settings */}
      <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-bold text-ink-900 dark:text-ink-100">
            <Percent className="h-4 w-4 text-brand-500" /> Platform Commission
          </p>
          <p className="mt-0.5 text-xs text-ink-500">
            AutoCare takes this % of every paid service. Mechanic earning = final amount − commission.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700">
            <input
              aria-label="Commission percentage"
              type="number"
              min={0}
              max={100}
              step={0.5}
              defaultValue={config?.platformCommissionPercentage ?? 15}
              onChange={(e) => setCommissionDraft(e.target.value)}
              className="w-20 bg-transparent text-sm font-bold text-ink-900 outline-none dark:text-ink-100"
            />
            <span className="text-sm font-bold text-ink-400">%</span>
          </div>
          <Button
            size="sm"
            loading={updateCommission.isPending}
            disabled={commissionDraft === '' || Number(commissionDraft) < 0 || Number(commissionDraft) > 100}
            onClick={() => updateCommission.mutate(Number(commissionDraft))}
          >
            <Save className="h-4 w-4" /> Update
          </Button>
        </div>
      </div>

      {/* Add new service */}
      <div className="card p-5">
        <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink-900 dark:text-ink-100">
          <Plus className="h-4 w-4 text-brand-500" /> Add a service
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            aria-label="Service name"
            value={newService.serviceName}
            onChange={(e) => setNewService((s) => ({ ...s, serviceName: e.target.value }))}
            placeholder="Service name, e.g. Wheel Alignment"
            className="input flex-1 min-w-[200px]"
          />
          <input
            aria-label="Description"
            value={newService.description}
            onChange={(e) => setNewService((s) => ({ ...s, description: e.target.value }))}
            placeholder="Short description (optional)"
            className="input flex-1 min-w-[200px]"
          />
          <input
            aria-label="Base price"
            type="number"
            min={0}
            step={0.01}
            value={newService.basePrice}
            onChange={(e) => setNewService((s) => ({ ...s, basePrice: e.target.value }))}
            placeholder="Price ₹"
            className="input w-32"
          />
          <Button onClick={() => create.mutate()} loading={create.isPending} disabled={!canAdd}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      </div>

      <AdminTable
        title="Service Catalogue"
        subtitle="Edit prices or toggle availability."
        rows={rows}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        searchPlaceholder="Search services…"
        columns={[
          {
            header: 'Service',
            render: (r) => (
              <span>
                <span className="font-semibold text-ink-900 dark:text-ink-100">{r.serviceName}</span>
                {r.description && <span className="block text-xs text-ink-400">{r.description}</span>}
              </span>
            ),
            searchValue: (r) => `${r.serviceName} ${r.description ?? ''}`,
          },
          {
            header: 'Base Price',
            render: (r) =>
              editingId === r.id ? (
                <input
                  aria-label={`Price for ${r.serviceName}`}
                  type="number"
                  min={0}
                  step={0.01}
                  defaultValue={r.basePrice}
                  onChange={(e) => setPriceDraft(e.target.value)}
                  className="input h-8 w-28 py-1 text-sm"
                />
              ) : (
                <span className="font-bold text-ink-900 dark:text-ink-100">{formatCurrency(r.basePrice)}</span>
              ),
            searchValue: (r) => String(r.basePrice),
          },
          {
            header: 'Active',
            render: (r) => (
              <button
                onClick={() => toggleActive.mutate({ id: r.id, active: !r.active })}
                className={`relative h-6 w-11 rounded-full transition ${r.active ? 'bg-emerald-500' : 'bg-ink-200 dark:bg-ink-700'}`}
                aria-label={`Toggle ${r.serviceName} active`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${r.active ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            ),
            searchValue: (r) => (r.active ? 'active' : 'inactive'),
          },
          {
            header: 'Actions',
            render: (r) => {
              const isSaving = update.isPending && update.variables?.id === r.id;
              return editingId === r.id ? (
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    loading={isSaving}
                    onClick={() =>
                      update.mutate({
                        id: r.id,
                        data: {
                          serviceName: r.serviceName,
                          description: r.description ?? '',
                          basePrice: Number(priceDraft === '' ? r.basePrice : priceDraft),
                          active: r.active,
                        },
                      })
                    }
                  >
                    <Check className="h-4 w-4" /> Save
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => { setEditingId(r.id); setPriceDraft(String(r.basePrice)); }}>
                  <Pencil className="h-3.5 w-3.5" /> Edit Price
                </Button>
              );
            },
          },
        ]}
      />
    </div>
  );
}
