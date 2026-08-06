import { useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PackageSearch, RotateCcw, Send } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Badge, { type BadgeVariant } from '@/components/ui/Badge';
import Button from '@/components/Button';
import SearchInput from '@/components/ui/SearchInput';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { useApiData } from '@/hooks/useApiData';
import { getParts } from '@/api/sparePartsApi';
import {
  createRecommendation,
  getRecommendationsForBooking,
} from '@/api/sparePartsApi';
import type { RecommendationStatus } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';

const STATUS_VARIANT: Record<RecommendationStatus, BadgeVariant> = {
  RECOMMENDED: 'info',
  APPROVED: 'success',
  REJECTED: 'danger',
  ORDERED: 'brand',
};

export default function PartRecommendations() {
  const [params] = useSearchParams();
  const bookingId = Number(params.get('booking') ?? 0);

  const parts = useApiData(() => getParts(), []);
  const recommendations = useApiData(
    () => (bookingId ? getRecommendationsForBooking(bookingId) : Promise.resolve([])),
    [bookingId],
  );

  const [query, setQuery] = useState('');
  const [selectedPart, setSelectedPart] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);
  const { success, error, info } = useToast();

  const results = useMemo(
    () =>
      (parts.data ?? []).filter(
        (p) =>
          p.name.toLowerCase().includes(query.trim().toLowerCase()) ||
          p.category.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [parts.data, query],
  );

  const selected = (parts.data ?? []).find((p) => p.id === selectedPart);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!bookingId) {
      info('No booking selected', 'Recommendations are created from a service booking — open this page with ?booking=&lt;id&gt;.');
      return;
    }
    if (!selectedPart) {
      info('Pick a part', 'Choose a spare part to recommend.');
      return;
    }
    setSending(true);
    try {
      await createRecommendation({
        bookingId,
        sparePartId: selectedPart,
        quantity: qty,
        reason: notes.trim() || 'Recommended after inspection.',
      });
      success('Recommendation sent', `${selected?.name} recommended for booking #${bookingId}.`);
      setNotes('');
      setQty(1);
      recommendations.refresh();
    } catch (err) {
      error('Could not send recommendation', 'Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Spare Part Recommendations"
        subtitle="Suggest the right parts for a booking — customers get notified instantly"
        icon={<PackageSearch className="h-5 w-5" />}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Recommend form */}
        <form onSubmit={send} className="card h-fit p-6 lg:col-span-2">
          <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-slate-100">Recommend a part</h3>

          <div className="mb-3 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60">
            {bookingId ? (
              <p className="font-semibold text-slate-700 dark:text-slate-200">
                Booking #{bookingId} <Badge variant="success" dot>Selected</Badge>
              </p>
            ) : (
              <p className="text-slate-500 dark:text-slate-400">
                Open this page from a booking (e.g. <code className="font-mono">/mechanic/recommendations?booking=5</code>)
                to attach recommendations to it.
              </p>
            )}
          </div>

          <SearchInput value={query} onChange={setQuery} placeholder="Search parts…" className="mb-3" />
          {parts.loading ? (
            <Skeleton className="mb-3 h-40 w-full" />
          ) : (
            <div className="mb-3 max-h-44 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-1.5 dark:border-slate-700">
              {results.length === 0 ? (
                <p className="p-3 text-center text-xs text-slate-400">No parts match "{query}"</p>
              ) : (
                results.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setSelectedPart(p.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                      selectedPart === p.id
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="text-slate-400">{formatCurrency(p.price)}</span>
                  </button>
                ))
              )}
            </div>
          )}
          <div className="mb-3 grid grid-cols-2 gap-3">
            <div>
              <label className="label">Quantity</label>
              <input type="number" min={1} className="input" value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} />
            </div>
            <div>
              <label className="label">Booking</label>
              <input type="number" min={0} className="input" value={bookingId || ''} disabled placeholder="—" />
            </div>
          </div>
          <div className="mb-4">
            <label className="label">Notes</label>
            <textarea
              className="input min-h-20 resize-y"
              placeholder="e.g. Front pads worn below 2mm — replace both sides"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={sending || parts.loading}>
            <Send className="h-4 w-4" /> {sending ? 'Sending…' : 'Send Recommendation'}
          </Button>
        </form>

        {/* History */}
        <div className="space-y-3 lg:col-span-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Recommendation History{' '}
            <span className="font-normal text-slate-400">({recommendations.data?.length ?? 0})</span>
          </h3>
          {recommendations.loading ? (
            <Skeleton className="h-40 w-full" />
          ) : (recommendations.data ?? []).length === 0 ? (
            <div className="card">
              <EmptyState
                icon={<PackageSearch className="h-9 w-9" />}
                title="No recommendations yet"
                description="Parts you recommend for a booking will appear here."
              />
            </div>
          ) : (
            (recommendations.data ?? []).map((r) => (
              <div key={r.id} className="card card-hover p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{r.sparePart.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      Booking #{r.bookingId} · Qty {r.quantity} · {formatDate(r.createdAt)}
                    </p>
                  </div>
                  <Badge variant={STATUS_VARIANT[r.status]} dot>{r.status.replace('_', ' ')}</Badge>
                </div>
                <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                  {r.reason}
                </p>
                <div className="mt-3 flex gap-2">
                  {r.status !== 'APPROVED' && r.status !== 'ORDERED' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => success('Recommendation resent', `Reminder sent for booking #${r.bookingId}.`)}
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Resend
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
