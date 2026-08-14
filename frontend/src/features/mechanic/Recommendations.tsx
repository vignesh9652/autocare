import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Package, Plus, ThumbsUp, ThumbsDown } from 'lucide-react';
import { bookingApi, partsApi, recommendationsApi, getErrorMessage } from '@/lib/api';
import { toast } from '@/stores/toast-store';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/Badge';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/ui/Feedback';

export function Recommendations() {
  const jobs = useQuery({ queryKey: ['assigned-jobs'], queryFn: bookingApi.getAssigned });
  const parts = useQuery({ queryKey: ['all-parts'], queryFn: () => partsApi.getAll() });

  const [open, setOpen] = useState(false);
  const [bookingId, setBookingId] = useState<number | ''>('');
  const [sparePartId, setSparePartId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');

  const [recommendations, setRecommendations] = useState<Record<number, unknown[]>>({});

  const loadRecs = async (bookingId: number) => {
    try {
      const recs = await recommendationsApi.getForBooking(bookingId);
      setRecommendations((prev) => ({ ...prev, [bookingId]: recs }));
    } catch {
      setRecommendations((prev) => ({ ...prev, [bookingId]: [] }));
    }
  };

  const create = useMutation({
    mutationFn: () =>
      recommendationsApi.create({ bookingId: bookingId as number, sparePartId: sparePartId as number, quantity, reason: reason || undefined }),
    onSuccess: () => {
      toast('Part recommended to customer', 'success');
      setOpen(false);
      setBookingId(''); setSparePartId(''); setQuantity(1); setReason('');
      if (bookingId !== '') void loadRecs(bookingId);
    },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  if (jobs.isLoading || parts.isLoading) return <CardSkeleton count={3} />;
  if (jobs.isError || parts.isError) return <ErrorState message="Could not load data" />;

  const activeJobs = (jobs.data ?? []).filter((j) => ['ACCEPTED', 'IN_PROGRESS'].includes(j.status));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900 dark:text-ink-100">Part Recommendations</h1>
          <p className="mt-1 text-sm text-ink-500">Suggest genuine parts for the jobs you're working on.</p>
        </div>
        <Button onClick={() => setOpen(true)} disabled={activeJobs.length === 0}>
          <Plus className="h-4 w-4" /> Recommend Part
        </Button>
      </div>

      {activeJobs.length === 0 ? (
        <EmptyState icon={<Package className="h-6 w-6" />} title="No active jobs" description="Recommend parts once you're working on a job." />
      ) : (
        <div className="space-y-4">
          {activeJobs.map((j) => {
            const recs = (recommendations[j.id] ?? []) as Array<{ id: number; sparePart: { name: string; price: number }; quantity: number; reason?: string; status: string }>;
            return (
              <div key={j.id} className="card p-5">
                <button className="text-left" onClick={() => void loadRecs(j.id)}>
                  <p className="font-bold text-ink-900 dark:text-ink-100">Booking #{j.id} — {j.serviceType}</p>
                  <p className="text-xs text-ink-400">Tap to load recommendations for this job</p>
                </button>
                {recs.length > 0 && (
                  <div className="mt-4 space-y-2 border-t border-ink-100 pt-4 dark:border-ink-800">
                    {recs.map((r) => (
                      <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-ink-50 p-3 dark:bg-ink-800/60">
                        <div>
                          <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">{r.sparePart.name} × {r.quantity}</p>
                          <p className="text-xs text-ink-400">{formatCurrency(r.sparePart.price * r.quantity)}{r.reason ? ` · ${r.reason}` : ''}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge kind="recommendation" status={r.status} />
                          {r.status === 'APPROVED' && <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400"><ThumbsUp className="h-3.5 w-3.5" /> Customer approved</span>}
                          {r.status === 'REJECTED' && <span className="flex items-center gap-1 text-xs font-semibold text-red-500"><ThumbsDown className="h-3.5 w-3.5" /> Declined</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Recommend a part">
        <div className="space-y-4">
          <Select id="job" label="Job" value={bookingId} onChange={(e) => setBookingId(Number(e.target.value))}>
            <option value="">Select a job…</option>
            {activeJobs.map((j) => <option key={j.id} value={j.id}>Booking #{j.id} — {j.serviceType}</option>)}
          </Select>
          <Select id="part" label="Spare part" value={sparePartId} onChange={(e) => setSparePartId(Number(e.target.value))}>
            <option value="">Select a part…</option>
            {(parts.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.price)}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Select id="qty" label="Quantity" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}>
              {[1, 2, 3, 4, 5].map((q) => <option key={q} value={q}>{q}</option>)}
            </Select>
            <div className="flex items-end">
              <input
                id="reason"
                placeholder="Reason (optional)"
                className="input"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <Button className="w-full" onClick={() => create.mutate()} loading={create.isPending} disabled={bookingId === '' || sparePartId === ''}>
            Send Recommendation
          </Button>
        </div>
      </Modal>
    </div>
  );
}
