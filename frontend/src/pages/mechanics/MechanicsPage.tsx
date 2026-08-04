import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { createMechanic, getMechanics } from '@/api/mechanicApi';
import { getApiErrorMessage } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { Button, Card, Input, Modal, Spinner, StatusBadge } from '@/components';
import { formatRating } from '@/utils/format';
import type { Mechanic } from '@/types';

const EMPTY_FORM = { name: '', phone: '', email: '', serviceArea: '', skills: '' };

export default function MechanicsPage() {
  const { user } = useAuth();
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ available: '', skill: '', area: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setMechanics(
        await getMechanics({
          available: filters.available ? filters.available === 'true' : undefined,
          skill: filters.skill || undefined,
          area: filters.area || undefined,
        }),
      );
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load mechanics'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createMechanic({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        serviceArea: form.serviceArea.trim(),
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
      });
      setModalOpen(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to add mechanic'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-page py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Mechanics</h1>
          <p className="mt-1 text-sm text-slate-400">Find a vetted mechanic by skill, area, or availability</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ Add Mechanic</Button>
      </div>

      {/* Filters */}
      <div className="mb-6 grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="f-available">Availability</label>
          <select
            id="f-available"
            className="input"
            value={filters.available}
            onChange={(e) => setFilters({ ...filters, available: e.target.value })}
          >
            <option value="">Any</option>
            <option value="true">Available only</option>
          </select>
        </div>
        <Input label="Skill" value={filters.skill} onChange={(e) => setFilters({ ...filters, skill: e.target.value })} placeholder="e.g. Engine" />
        <Input label="Service Area" value={filters.area} onChange={(e) => setFilters({ ...filters, area: e.target.value })} placeholder="e.g. Bengaluru" />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <Spinner label="Loading mechanics…" className="py-20" />
      ) : mechanics.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="text-slate-400">No mechanics match your filters.</p>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {mechanics.map((m) => (
            <Card key={m.id} hoverable>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-600/20 text-lg font-bold text-brand-300">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-100">{m.name}</h3>
                    <p className="text-xs text-slate-400">{m.serviceArea}</p>
                  </div>
                </div>
                <StatusBadge status={m.availabilityStatus} />
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {m.skills.map((s) => (
                  <span key={s} className="rounded-full bg-slate-700/60 px-2.5 py-0.5 text-xs text-slate-300">
                    {s}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-700/50 pt-3 text-sm">
                <span className="text-slate-400">
                  ⭐ {formatRating(m.averageRating)} <span className="text-slate-600">·</span>{' '}
                  {m.totalJobsCompleted} jobs
                </span>
                <a href={`mailto:${m.email}`} className="text-xs text-brand-400 hover:text-brand-300">
                  Contact
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        title="Add Mechanic"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button form="mechanic-form" type="submit" loading={saving}>
              {saving ? 'Saving…' : 'Save Mechanic'}
            </Button>
          </>
        }
      >
        <form id="mechanic-form" onSubmit={handleSubmit}>
          <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ravi Kumar" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="9876543210" />
            <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="ravi@autocare.in" />
          </div>
          <Input label="Service Area" required value={form.serviceArea} onChange={(e) => setForm({ ...form, serviceArea: e.target.value })} placeholder="Bengaluru" />
          <Input
            label="Skills (comma separated)"
            value={form.skills}
            onChange={(e) => setForm({ ...form, skills: e.target.value })}
            placeholder="Engine, Suspension, Brakes"
          />
          {user?.role !== 'ADMIN' && (
            <p className="text-xs text-slate-500">Tip: mechanics can also be added via the admin dashboard.</p>
          )}
        </form>
      </Modal>
    </div>
  );
}
