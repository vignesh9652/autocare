import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { createBooking, getMyBookings, updateBookingStatus } from '@/api/bookingApi';
import { getMyVehicles } from '@/api/vehicleApi';
import { getApiErrorMessage } from '@/api/client';
import { Button, Card, Input, Modal, Spinner, StatusBadge } from '@/components';
import { formatCurrency, formatDateTime } from '@/utils/format';
import type { Booking, BookingStatus, Vehicle } from '@/types';

const STATUS_OPTIONS: BookingStatus[] = ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

const EMPTY_FORM = {
  vehicleId: '',
  serviceType: '',
  scheduledAt: '',
  address: '',
  preferredSkill: '',
  serviceArea: '',
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
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
      const [b, v] = await Promise.all([getMyBookings(), getMyVehicles()]);
      setBookings(b);
      setVehicles(v);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load bookings'));
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
      await createBooking({
        vehicleId: Number(form.vehicleId),
        serviceType: form.serviceType.trim(),
        scheduledAt: form.scheduledAt,
        address: form.address.trim(),
        preferredSkill: form.preferredSkill.trim() || undefined,
        serviceArea: form.serviceArea.trim() || undefined,
      });
      setModalOpen(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to create booking'));
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (id: number, status: BookingStatus) => {
    try {
      await updateBookingStatus(id, { status });
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update status'));
    }
  };

  return (
    <div className="container-page py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">My Bookings</h1>
          <p className="mt-1 text-sm text-slate-400">Schedule repairs and track their progress</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ New Booking</Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <Spinner label="Loading bookings…" className="py-20" />
      ) : bookings.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="text-slate-400">No bookings yet. Schedule your first service.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <Card key={b.id} hoverable>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-100">{b.serviceType}</h3>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Vehicle #{b.vehicleId}
                    {b.mechanicId ? ` · Mechanic #${b.mechanicId}` : ' · Awaiting mechanic'}
                  </p>
                </div>
                <StatusBadge status={b.status} />
              </div>

              <div className="mt-3 grid gap-2 text-sm text-slate-400 sm:grid-cols-3">
                <span>📅 {formatDateTime(b.scheduledAt)}</span>
                <span>📍 {b.address}</span>
                <span>💰 {formatCurrency(b.estimatedCost)}</span>
              </div>

              {/* Status controls */}
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-700/50 pt-3">
                <span className="text-xs text-slate-500">Update status:</span>
                {STATUS_OPTIONS.filter((s) => s !== b.status).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatus(b.id, s)}
                    className="rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-300 transition-colors hover:border-brand-500 hover:text-white"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        title="New Booking"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button form="booking-form" type="submit" loading={saving}>
              {saving ? 'Creating…' : 'Create Booking'}
            </Button>
          </>
        }
      >
        <form id="booking-form" onSubmit={handleSubmit}>
          {vehicles.length === 0 ? (
            <p className="mb-4 rounded-lg bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
              You need at least one vehicle before booking. Add one from the Vehicles page.
            </p>
          ) : (
            <div className="mb-4">
              <label className="label" htmlFor="b-vehicle">Vehicle</label>
              <select
                id="b-vehicle"
                className="input"
                required
                value={form.vehicleId}
                onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
              >
                <option value="">Select a vehicle…</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.make} {v.model} · {v.registrationNumber}
                  </option>
                ))}
              </select>
            </div>
          )}
          <Input
            label="Service Type"
            required
            value={form.serviceType}
            onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
            placeholder="e.g. Oil Change, Brake Repair, Engine Service"
          />
          <Input
            label="Scheduled Date & Time"
            type="datetime-local"
            required
            value={form.scheduledAt}
            onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
          />
          <Input
            label="Address"
            required
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Service address"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Preferred Skill" value={form.preferredSkill} onChange={(e) => setForm({ ...form, preferredSkill: e.target.value })} placeholder="e.g. Suspension" />
            <Input label="Service Area" value={form.serviceArea} onChange={(e) => setForm({ ...form, serviceArea: e.target.value })} placeholder="e.g. Bengaluru" />
          </div>
        </form>
      </Modal>
    </div>
  );
}
