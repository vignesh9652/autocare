import { useCallback, useEffect, useState } from 'react';
import { getMechanics } from '@/api/mechanicApi';
import { getApiErrorMessage } from '@/api/client';
import { Card, ReviewsList, Spinner } from '@/components';
import type { Mechanic } from '@/types';

export default function ReviewsPage() {
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMechanics = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await getMechanics();
      setMechanics(list);
      // Default to the first mechanic so the page is never empty.
      if (list.length > 0) setSelectedId((prev) => prev ?? list[0].id);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load mechanics'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMechanics();
  }, [loadMechanics]);

  return (
    <div className="container-page py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Reviews</h1>
        <p className="mt-1 text-sm text-slate-400">
          See what customers say about each mechanic — leave yours from a completed booking
        </p>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <Spinner label="Loading mechanics…" className="py-20" />
      ) : mechanics.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="text-slate-400">No mechanics available yet.</p>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Mechanic picker */}
          <div>
            <Card title="Mechanics">
              <div className="space-y-1">
                {mechanics.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedId(m.id)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                      selectedId === m.id
                        ? 'bg-brand-600/20 text-brand-200'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {m.name}
                    <span className="block text-xs font-normal text-slate-500">
                      {m.serviceArea}
                    </span>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Reviews for the selected mechanic */}
          <div className="lg:col-span-2">
            <Card
              title={mechanics.find((m) => m.id === selectedId)?.name ?? 'Reviews'}
              subtitle="What customers are saying"
            >
              {selectedId ? (
                <ReviewsList mechanicId={selectedId} />
              ) : (
                <p className="text-sm text-slate-500">Select a mechanic to see their reviews.</p>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
