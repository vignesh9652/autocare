import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteVehicle, getVehicles } from '@/api/vehicleApi';
import { getApiErrorMessage } from '@/api/client';
import { Button, Card, Modal, StatusBadge } from '@/components';
import type { Vehicle } from '@/types';

export default function VehicleList() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setVehicles(await getVehicles());
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load vehicles'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError('');
    try {
      await deleteVehicle(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to delete vehicle'));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="container-page py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">My Vehicles</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Vehicles registered to your account — used when booking service
          </p>
        </div>
        <Button onClick={() => navigate('/vehicles/new')}>+ Add Vehicle</Button>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div key={i} className="card h-44 animate-pulse bg-slate-50/70 dark:bg-slate-800/50" />
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="text-4xl" aria-hidden>🚗</p>
          <p className="mt-3 text-slate-500 dark:text-slate-400">No vehicles yet.</p>
          <p className="mt-1 text-sm text-slate-500">
            Add your first vehicle to start booking service.
          </p>
          <Button variant="secondary" className="mt-4" onClick={() => navigate('/vehicles/new')}>
            Add your first vehicle
          </Button>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => (
            <Card key={v.id} hoverable className="flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {v.make} {v.model}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">Model {v.year}</p>
                </div>
                <StatusBadge status={v.vehicleType} />
              </div>

              <p className="mt-3 font-mono text-sm tracking-wide text-slate-700 dark:text-slate-300">
                {v.registrationNumber}
              </p>

              <div className="mt-auto flex items-center gap-2 border-t border-slate-700/50 pt-3">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => navigate(`/vehicles/${v.id}/edit`)}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  className="flex-1"
                  onClick={() => setDeleteTarget(v)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={deleteTarget !== null}
        title="Delete Vehicle?"
        onClose={() => setDeleteTarget(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              {deleting ? 'Deleting…' : 'Delete Vehicle'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-700 dark:text-slate-300">
          Are you sure you want to delete{' '}
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {deleteTarget ? `${deleteTarget.make} ${deleteTarget.model}` : ''}
          </span>
          ? This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
