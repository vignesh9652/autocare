import { useMemo, useState, type FormEvent } from 'react';
import { Car, Clock3, FileClock, Pencil, Plus, Trash2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import { ProgressRing } from '@/components/charts';
import { useToast } from '@/components/ui/Toast';
import { getApiErrorMessage } from '@/api/client';
import { useApiData } from '@/hooks/useApiData';
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from '@/api/vehicleApi';
import { getBookings } from '@/api/bookingApi';
import { toDashVehicle, VEHICLE_TYPE_LABELS } from '@/utils/apiMappers';
import type { VehicleType } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';

interface VehicleFormState {
  brand: string;
  model: string;
  registration: string;
  year: number;
  vehicleType: VehicleType;
}

const EMPTY_FORM: VehicleFormState = {
  brand: '',
  model: '',
  registration: '',
  year: 2024,
  vehicleType: 'CAR',
};

// Mirrors the backend rule: letters, numbers, spaces and hyphens only.
const REGISTRATION_PATTERN = /^[A-Za-z0-9\s-]+$/;

export default function MyVehicles() {
  const vehicles = useApiData(() => getVehicles(), []);
  const bookings = useApiData(() => getBookings(), []);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ReturnType<typeof toDashVehicle> | null>(null);
  const [deleting, setDeleting] = useState<ReturnType<typeof toDashVehicle> | null>(null);
  const [history, setHistory] = useState<ReturnType<typeof toDashVehicle> | null>(null);
  const [form, setForm] = useState<VehicleFormState>(EMPTY_FORM);
  const [regError, setRegError] = useState('');
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();

  const dashVehicles = useMemo(
    () => (vehicles.data ?? []).map(toDashVehicle),
    [vehicles.data],
  );

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setRegError('');
    setModalOpen(true);
  };

  const openEdit = (v: ReturnType<typeof toDashVehicle>) => {
    setEditing(v);
    setForm({
      brand: v.brand,
      model: v.model,
      registration: v.registration,
      year: v.year,
      vehicleType: v.vehicleType,
    });
    setRegError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const registration = form.registration.trim().toUpperCase();
    if (!REGISTRATION_PATTERN.test(registration) || registration.length > 30) {
      setRegError('Use letters, numbers, spaces and hyphens only (e.g. KA-01 AB 1234).');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        make: form.brand.trim(),
        model: form.model.trim(),
        year: form.year,
        registrationNumber: registration,
        vehicleType: form.vehicleType,
      };
      if (editing) {
        await updateVehicle(editing.id, payload);
        success('Vehicle updated', `${form.brand} ${form.model} details saved.`);
      } else {
        await createVehicle(payload);
        success('Vehicle added', `${form.brand} ${form.model} registered to your garage.`);
      }
      setModalOpen(false);
      vehicles.refresh();
    } catch (err) {
      error('Could not save vehicle', getApiErrorMessage(err, 'Please check the details and try again.'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteVehicle(deleting.id);
      success('Vehicle removed', `${deleting.brand} ${deleting.model} was deleted.`);
      setDeleting(null);
      vehicles.refresh();
    } catch (err) {
      error('Could not delete vehicle', getApiErrorMessage(err, 'Please try again.'));
    }
  };

  const serviceHistory = useMemo(() => {
    if (!history) return [];
    return (bookings.data ?? [])
      .filter((b) => b.vehicleId === history.id)
      .sort((a, b) => (a.scheduledAt < b.scheduledAt ? 1 : -1))
      .map((b) => ({
        service: b.serviceType,
        date: b.scheduledAt?.slice(0, 10) ?? '',
        cost: b.estimatedCost,
        mechanic: b.mechanicId !== null ? `Mechanic #${b.mechanicId}` : 'Auto-assigned',
        status: b.status,
      }));
  }, [history, bookings.data]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="My Vehicles"
        subtitle="Manage your garage, track service schedules and health"
        icon={<Car className="h-5 w-5" />}
        actions={
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add Vehicle
          </Button>
        }
      />

      {vehicles.loading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-64 animate-pulse" />
          ))}
        </div>
      ) : dashVehicles.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No vehicles yet"
            description="Add your first vehicle to start booking services and tracking maintenance."
            action={<Button onClick={openAdd}><Plus className="h-4 w-4" /> Add Vehicle</Button>}
          />
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {dashVehicles.map((v) => (
            <div
              key={v.id}
              className="card card-hover group overflow-hidden"
            >
              {/* Header strip */}
              <div className="relative flex items-center justify-between bg-gradient-to-r from-brand-600 to-sky-500 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur-sm">
                    <Car className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">{v.brand} {v.model}</p>
                    <p className="text-xs text-white/80">{v.registration}</p>
                  </div>
                </div>
                <Badge variant="neutral" className="!border-white/25 !bg-white/15 !text-white">{v.year}</Badge>
              </div>

              <div className="p-5">
                {/* Health */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="space-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                    <p>{v.year} · {v.registration}</p>
                    <p className="flex items-center gap-1"><Car className="h-3.5 w-3.5" /> {VEHICLE_TYPE_LABELS[v.vehicleType]}</p>
                  </div>
                  <ProgressRing value={v.healthScore} size={64} strokeWidth={7} label="" />
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/60">
                    <p className="flex items-center gap-1 font-medium text-slate-400 dark:text-slate-500">
                      <Clock3 className="h-3 w-3" /> Last service
                    </p>
                    <p className="mt-0.5 font-semibold text-slate-700 dark:text-slate-200">
                      {serviceHistoryFor(v).length > 0 ? formatDate(serviceHistoryFor(v)[0].scheduledAt) : 'Not serviced yet'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-2.5 dark:bg-amber-500/10">
                    <p className="flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
                      <FileClock className="h-3 w-3" /> Bookings
                    </p>
                    <p className="mt-0.5 font-semibold text-amber-700 dark:text-amber-400">
                      {serviceHistoryFor(v).length} total
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <Button variant="secondary" size="sm" className="flex-1" onClick={() => openEdit(v)}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1" onClick={() => setHistory(v)}>
                    <FileClock className="h-3.5 w-3.5" /> History
                  </Button>
                  <button
                    onClick={() => setDeleting(v)}
                    aria-label={`Delete ${v.model}`}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / edit modal */}
      <Modal
        open={modalOpen}
        title={editing ? 'Edit Vehicle' : 'Add Vehicle'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" form="vehicle-form" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Vehicle'}</Button>
          </>
        }
        maxWidth="max-w-lg"
      >
        <form id="vehicle-form" onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Brand / Make" required placeholder="Hyundai" value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            <Input label="Model" required placeholder="Creta" value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })} />
          </div>
          <Input
            label="Registration Number"
            required
            placeholder="KA-01-AB-1234"
            maxLength={30}
            value={form.registration}
            error={regError || undefined}
            hint={!regError ? 'Letters, numbers, spaces and hyphens only.' : undefined}
            onChange={(e) => {
              setForm({ ...form, registration: e.target.value.toUpperCase() });
              if (regError) setRegError('');
            }}
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="mb-4">
              <label className="label">Vehicle Type</label>
              <select className="select" value={form.vehicleType}
                onChange={(e) => setForm({ ...form, vehicleType: e.target.value as VehicleType })}>
                <option value="CAR">Car</option>
                <option value="SUV">SUV</option>
                <option value="SEDAN">Sedan</option>
                <option value="HATCHBACK">Hatchback</option>
                <option value="TRUCK">Truck</option>
                <option value="VAN">Van</option>
                <option value="BIKE">Bike</option>
                <option value="MOTORCYCLE">Motorcycle</option>
              </select>
            </div>
            <Input label="Year" type="number" min={1990} max={2027} value={form.year}
              onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} />
          </div>
        </form>
      </Modal>

      {/* Service history modal */}
      <Modal open={Boolean(history)} title={`Service History · ${history?.registration ?? ''}`} onClose={() => setHistory(null)} maxWidth="max-w-lg">
        {serviceHistory.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
            No service records yet — bookings for this vehicle will appear here.
          </p>
        ) : (
          <ol className="space-y-0">
            {serviceHistory.map((s, i) => (
              <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
                {i < serviceHistory.length - 1 && (
                  <span className="absolute left-[15px] top-9 h-[calc(100%-2rem)] w-0.5 bg-slate-200 dark:bg-slate-700" />
                )}
                <span className="relative z-10 mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-600 ring-4 ring-white dark:bg-brand-500/15 dark:text-brand-400 dark:ring-slate-900">
                  <Car className="h-4 w-4" />
                </span>
                <div className="pb-1">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{s.service}</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(s.date)} · {s.mechanic} · {s.status.replace('_', ' ')}
                  </p>
                  <p className="mt-0.5 text-xs font-bold text-brand-600 dark:text-brand-400">
                    {s.cost ? formatCurrency(s.cost) : 'Quote pending'}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete vehicle?"
        message={`This will permanently remove ${deleting?.brand} ${deleting?.model} (${deleting?.registration}) from your garage.`}
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );

  function serviceHistoryFor(v: ReturnType<typeof toDashVehicle>) {
    return (bookings.data ?? [])
      .filter((b) => b.vehicleId === v.id)
      .sort((a, b) => (a.scheduledAt < b.scheduledAt ? 1 : -1));
  }
}
