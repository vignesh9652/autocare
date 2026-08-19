import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Car, Plus, Trash2, Upload, Pencil } from 'lucide-react';
import { vehicleApi, getErrorMessage } from '@/lib/api';
import { toast } from '@/stores/toast-store';
import { VehicleRequest, VehicleType } from '@/types';
import { assetUrl } from '@/lib/images';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/ui/Feedback';

const TYPES: VehicleType[] = ['CAR', 'BIKE'];

const emptyForm = { make: '', model: '', year: new Date().getFullYear(), registrationNumber: '', vehicleType: 'CAR' as VehicleType };

export function MyVehicles() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<VehicleRequest>(emptyForm);
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['my-vehicles'], queryFn: vehicleApi.getMyVehicles });

  const save = useMutation({
    mutationFn: () => (editing ? vehicleApi.updateVehicle(editing, form) : vehicleApi.createVehicle(form)),
    onSuccess: () => {
      toast(editing ? 'Vehicle updated' : 'Vehicle added', 'success');
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
      void qc.invalidateQueries({ queryKey: ['my-vehicles'] });
    },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  const remove = useMutation({
    mutationFn: (id: number) => vehicleApi.deleteVehicle(id),
    onSuccess: () => {
      toast('Vehicle removed', 'info');
      void qc.invalidateQueries({ queryKey: ['my-vehicles'] });
    },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  const uploadImage = async (id: number, file: File) => {
    setUploadingId(id);
    try {
      await vehicleApi.uploadImage(id, file);
      toast('Photo uploaded', 'success');
      void qc.invalidateQueries({ queryKey: ['my-vehicles'] });
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setUploadingId(null);
    }
  };

  const openAdd = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (id: number, v: VehicleRequest) => { setEditing(id); setForm(v); setOpen(true); };

  if (isLoading) return <CardSkeleton count={3} />;
  if (isError) return <ErrorState message="Could not load vehicles" onRetry={() => refetch()} />;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900 dark:text-ink-100">My Vehicles</h1>
          <p className="mt-1 text-sm text-ink-500">Keep your fleet updated for faster bookings.</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4" /> Add Vehicle</Button>
      </div>

      {!data || data.length === 0 ? (
        <EmptyState icon={<Car className="h-6 w-6" />} title="No vehicles yet" description="Add your first vehicle to book doorstep services." action={<Button onClick={openAdd}>Add Vehicle</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence>
            {data.map((v) => (
              <motion.div key={v.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="card overflow-hidden">
                <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-ink-800 to-ink-900">
                  {v.imageUrl ? (
                    <img src={assetUrl(v.imageUrl)} alt={`${v.make} ${v.model}`} className="h-full w-full object-cover" />
                  ) : (
                    <Car className="h-12 w-12 text-ink-600" />
                  )}
                  <label className="absolute bottom-2 right-2 cursor-pointer rounded-xl bg-black/60 p-2 text-white backdrop-blur transition hover:bg-black/80">
                    <Upload className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingId === v.id}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadImage(v.id, f); e.target.value = ''; }}
                    />
                  </label>
                  {uploadingId === v.id && <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-semibold text-white">Uploading…</span>}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-ink-900 dark:text-ink-100">{v.make} {v.model}</p>
                      <p className="text-xs text-ink-400">{v.year} · {v.vehicleType} · {v.registrationNumber}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(v.id, v)} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-brand-600 dark:hover:bg-ink-800" title="Edit"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => remove.mutate(v.id)} className="rounded-lg p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10" title="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Vehicle' : 'Add Vehicle'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input id="make" label="Make" placeholder="Toyota" value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} />
            <Input id="model" label="Model" placeholder="Innova" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input id="year" label="Year" type="number" min={1980} max={2030} value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} />
            <Select id="type" label="Type" value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value as VehicleType })}>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
          <Input id="reg" label="Registration Number" placeholder="KA 01 AB 1234" value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value.toUpperCase() })} />
          <Button className="w-full" onClick={() => save.mutate()} loading={save.isPending} disabled={!form.make || !form.model || !form.registrationNumber}>
            {editing ? 'Save Changes' : 'Add Vehicle'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
