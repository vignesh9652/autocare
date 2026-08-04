import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createVehicle, getVehicle, updateVehicle } from '@/api/vehicleApi';
import { getApiErrorMessage } from '@/api/client';
import { Button, Card, Input, Spinner } from '@/components';
import type { VehicleType } from '@/types';

const VEHICLE_TYPES: VehicleType[] = [
  'CAR', 'SEDAN', 'SUV', 'HATCHBACK', 'TRUCK', 'VAN', 'BIKE', 'MOTORCYCLE',
];

interface FormState {
  make: string;
  model: string;
  year: string;
  registrationNumber: string;
  vehicleType: VehicleType;
}

const EMPTY: FormState = {
  make: '',
  model: '',
  year: String(new Date().getFullYear()),
  registrationNumber: '',
  vehicleType: 'SEDAN',
};

/** Add (no :id) or edit (:id) a vehicle. Redirects to /vehicles on success. */
export default function VehicleForm() {
  const { id } = useParams<{ id: string }>();
  const editingId = id ? Number(id) : null;
  const isEditing = editingId !== null && !Number.isNaN(editingId);

  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill when editing.
  useEffect(() => {
    if (!isEditing) return;
    let cancelled = false;
    (async () => {
      try {
        const v = await getVehicle(editingId as number);
        if (!cancelled) {
          setForm({
            make: v.make,
            model: v.model,
            year: String(v.year),
            registrationNumber: v.registrationNumber,
            vehicleType: v.vehicleType,
          });
        }
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Failed to load vehicle'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (field: keyof FormState) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        make: form.make.trim(),
        model: form.model.trim(),
        year: Number(form.year),
        registrationNumber: form.registrationNumber.trim(),
        vehicleType: form.vehicleType,
      };
      if (isEditing) {
        await updateVehicle(editingId as number, payload);
      } else {
        await createVehicle(payload);
      }
      navigate('/vehicles', { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, isEditing ? 'Failed to update vehicle' : 'Failed to add vehicle'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container-page py-10">
        <Spinner label="Loading vehicle…" className="py-24" />
      </div>
    );
  }

  return (
    <div className="container-page flex justify-center py-10">
      <Card className="w-full max-w-lg p-8">
        <Link to="/vehicles" className="text-sm text-brand-400 hover:text-brand-300">
          ← Back to vehicles
        </Link>
        <div className="mt-3 mb-6">
          <h1 className="text-2xl font-bold text-slate-100">
            {isEditing ? 'Edit Vehicle' : 'Add Vehicle'}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {isEditing ? 'Update the details below and save.' : 'Register a vehicle to your account.'}
          </p>
        </div>

        {error && (
          <div role="alert" className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Make"
              required
              value={form.make}
              onChange={handleChange('make')}
              placeholder="Maruti Suzuki"
            />
            <Input
              label="Model"
              required
              value={form.model}
              onChange={handleChange('model')}
              placeholder="Swift"
            />
            <Input
              label="Year"
              type="number"
              min={1886}
              max={2100}
              required
              value={form.year}
              onChange={handleChange('year')}
            />
            <div className="mb-4">
              <label className="label" htmlFor="vehicle-type">Type</label>
              <select
                id="vehicle-type"
                className="input"
                value={form.vehicleType}
                onChange={(e) => setForm((f) => ({ ...f, vehicleType: e.target.value as VehicleType }))}
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
            onChange={handleChange('registrationNumber')}
            placeholder="KA-01-AB-1234"
            hint="Letters, numbers, spaces and hyphens only"
          />
          <div className="mt-2 flex gap-3">
            <Button type="submit" loading={saving} className="flex-1">
              {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Vehicle'}
            </Button>
            <Button
              variant="ghost"
              className="flex-1"
              type="button"
              onClick={() => navigate('/vehicles')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
