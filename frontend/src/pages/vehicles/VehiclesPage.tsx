import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  createVehicle,
  deleteVehicle,
  getMyVehicles,
} from '@/api/vehicleApi';
import { getApiErrorMessage } from '@/api/client';
import { Button, Card, Input, Modal, Spinner, StatusBadge } from '@/components';
import type { Vehicle, VehicleType } from '@/types';

const VEHICLE_TYPES: VehicleType[] = [
  'CAR', 'SEDAN', 'SUV', 'HATCHBACK', 'TRUCK', 'VAN', 'BIKE', 'MOTORCYCLE',
];

const EMPTY_FORM = {
  make: '',
  model: '',
  year: new Date().getFullYear().toString(),
  registrationNumber: '',
  vehicleType: 'SEDAN' as VehicleType,
};

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setVehicles(await getMyVehicles());
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load vehicles'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createVehicle({
        make: form.make.trim(),
        model: form.model.trim(),
        year: Number(form.year),
        registrationNumber: form.registrationNumber.trim(),
        vehicleType: form.vehicleType,
      });
      setModalOpen(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to add vehicle'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this vehicle? This cannot be undone.')) return;
    try {
      await deleteVehicle(id);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to delete vehicle'));
    }
  };

  return (
    <div className="container-page py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">My Vehicles</h1>
          <p className="mt-1 text-sm text-slate-400">Vehicles registered to your account</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ Add Vehicle</Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <Spinner label="Loading vehicles…" className="py-20" />
      ) : vehicles.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="text-slate-400">No vehicles yet. Add your first vehicle to start booking service.</p>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => (
            <Card key={v.id} hoverable>
              <div className="flex items-start justify-between">
                <h3 className="text-base font-semibold text-slate-100">
                  {v.make} {v.model}
                </h3>
                <button
                  onClick={() => handleDelete(v.id)}
                  aria-label={`Delete ${v.make} ${v.model}`}
                  className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <p className="mt-2 text-sm text-slate-400">{v.registrationNumber}</p>
              <div className="mt-3 flex items-center justify-between">
                <StatusBadge status={v.vehicleType} />
                <span className="text-xs text-slate-500">Model {v.year}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        title="Add Vehicle"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button form="vehicle-form" type="submit" loading={saving}>
              {saving ? 'Saving…' : 'Save Vehicle'}
            </Button>
          </>
        }
      >
        <form id="vehicle-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Make" required value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} placeholder="Maruti Suzuki" />
            <Input label="Model" required value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Swift" />
            <Input label="Year" type="number" min={1886} max={2100} required value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
            <div className="mb-4">
              <label className="label" htmlFor="vehicle-type">Type</label>
              <select
                id="vehicle-type"
                className="input"
                value={form.vehicleType}
                onChange={(e) => setForm({ ...form, vehicleType: e.target.value as VehicleType })}
              >
                {VEHICLE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <Input
            label="Registration Number"
            required
            value={form.registrationNumber}
            onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
            placeholder="KA-01-AB-1234"
            hint="Letters, numbers, spaces and hyphens only"
          />
        </form>
      </Modal>
    </div>
  );
}
