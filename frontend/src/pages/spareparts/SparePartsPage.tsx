import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { createPart, getParts } from '@/api/sparePartsApi';
import { getApiErrorMessage } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { Button, Card, Input, Modal, Spinner, StatusBadge } from '@/components';
import { formatCurrency } from '@/utils/format';
import type { SparePart } from '@/types';

const EMPTY_FORM = {
  name: '',
  description: '',
  category: '',
  price: '',
  stockQuantity: '',
  compatibleVehicleModels: '',
};

export default function SparePartsPage() {
  const { user } = useAuth();
  const canAdd = user?.role === 'ADMIN' || user?.role === 'MECHANIC';

  const [parts, setParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setParts(await getParts({ search: search || undefined, category: category || undefined }));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load spare parts'));
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createPart({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        category: form.category.trim(),
        price: Number(form.price),
        stockQuantity: Number(form.stockQuantity),
        compatibleVehicleModels: form.compatibleVehicleModels
          .split(',')
          .map((m) => m.trim())
          .filter(Boolean),
      });
      setModalOpen(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to add part'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-page py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Spare Parts</h1>
          <p className="mt-1 text-sm text-slate-400">Genuine parts catalog with compatibility info</p>
        </div>
        {canAdd && <Button onClick={() => setModalOpen(true)}>+ Add Part</Button>}
      </div>

      {/* Filters */}
      <div className="mb-6 grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:grid-cols-2">
        <Input label="Search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search parts…" />
        <Input label="Category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Brakes, Engine, Filters" />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <Spinner label="Loading parts…" className="py-20" />
      ) : parts.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="text-slate-400">No parts found{search || category ? ' for your filters' : ''}.</p>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {parts.map((p) => (
            <Card key={p.id} hoverable className="flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-semibold text-slate-100">{p.name}</h3>
                <StatusBadge status={p.stockQuantity <= 5 ? 'LOW STOCK' : 'IN STOCK'} />
              </div>
              {p.description && <p className="mt-2 line-clamp-2 text-sm text-slate-400">{p.description}</p>}

              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-slate-700/60 px-2.5 py-0.5 text-xs text-slate-300">{p.category}</span>
                {p.compatibleVehicleModels.slice(0, 3).map((m) => (
                  <span key={m} className="rounded-full bg-brand-600/15 px-2.5 py-0.5 text-xs text-brand-300">{m}</span>
                ))}
              </div>

              <div className="mt-auto flex items-center justify-between border-t border-slate-700/50 pt-3">
                <span className="text-lg font-bold text-accent-400">{formatCurrency(p.price)}</span>
                <span className={`text-xs font-medium ${p.stockQuantity <= 5 ? 'text-red-400' : 'text-slate-400'}`}>
                  {p.stockQuantity} in stock
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        title="Add Spare Part"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button form="part-form" type="submit" loading={saving}>
              {saving ? 'Saving…' : 'Save Part'}
            </Button>
          </>
        }
      >
        <form id="part-form" onSubmit={handleSubmit}>
          <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Brake Pad Set" />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="High-quality ceramic pads" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Category" required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Brakes" />
            <Input label="Price (₹)" type="number" min={0} step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <Input label="Stock Quantity" type="number" min={0} required value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} />
            <Input
              label="Compatible Models (comma separated)"
              value={form.compatibleVehicleModels}
              onChange={(e) => setForm({ ...form, compatibleVehicleModels: e.target.value })}
              placeholder="Swift, Baleno, Dzire"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
