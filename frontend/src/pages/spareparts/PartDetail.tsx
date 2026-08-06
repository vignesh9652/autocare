import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPart } from '@/api/sparePartsApi';
import { getApiErrorMessage } from '@/api/client';
import { Card, Spinner, StatusBadge } from '@/components';
import { formatCurrency } from '@/utils/format';
import type { SparePart } from '@/types';

const LOW_STOCK_THRESHOLD = 5;

/** Convert common YouTube share/short URLs to an embeddable URL. */
function toEmbedUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    }
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
      const match = u.pathname.match(/^\/embed\/(.+)/);
      if (match) return url;
    }
    return url;
  } catch {
    return url;
  }
}

export default function PartDetail() {
  const { id } = useParams<{ id: string }>();
  const partId = Number(id);

  const [part, setPart] = useState<SparePart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const p = await getPart(partId);
        if (!cancelled) setPart(p);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Failed to load part'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [partId]);

  if (loading) {
    return (
      <div className="container-page py-10">
        <Spinner label="Loading part…" className="py-24" />
      </div>
    );
  }

  if (error || !part) {
    return (
      <div className="container-page py-16">
        <div role="alert" className="rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error || 'Part not found'}
        </div>
        <Link to="/spare-parts" className="mt-4 inline-block text-sm text-brand-600 dark:text-brand-400 hover:text-brand-600 dark:hover:text-brand-300">
          ← Back to catalog
        </Link>
      </div>
    );
  }

  const lowStock = part.stockQuantity <= LOW_STOCK_THRESHOLD;
  const steps = (part.installationSteps ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="container-page py-10">
      <Link to="/spare-parts" className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-600 dark:hover:text-brand-300">
        ← Back to catalog
      </Link>

      <div className="mt-3 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{part.name}</h1>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-brand-600/15 px-2.5 py-0.5 text-xs font-medium text-brand-600 dark:text-brand-300">
                    {part.category}
                  </span>
                  <StatusBadge status={lowStock ? 'LOW STOCK' : 'IN STOCK'} />
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-wide text-slate-500">Price</div>
                <div className="text-2xl font-extrabold text-emerald-600 dark:text-accent-400">
                  {formatCurrency(part.price)}
                </div>
                <div className={`text-xs font-medium ${lowStock ? 'text-red-700 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  {part.stockQuantity === 0
                    ? 'Out of stock'
                    : `${part.stockQuantity} in stock`}
                </div>
              </div>
            </div>

            {part.description && (
              <p className="mt-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{part.description}</p>
            )}
          </Card>

          {/* Tutorial video */}
          {part.tutorialVideoUrl && (
            <Card
              title="Installation tutorial"
              subtitle="Watch the official guide for this part"
              className="mt-6"
            >
              <div className="aspect-video overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                <iframe
                  src={toEmbedUrl(part.tutorialVideoUrl)}
                  title={`${part.name} installation tutorial`}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </Card>
          )}

          {/* DIY installation steps */}
          {steps.length > 0 && (
            <Card
              title="DIY installation guide"
              subtitle="Numbered steps to install this part yourself"
              className="mt-6"
            >
              <ol className="space-y-3">
                {steps.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600/20 text-xs font-bold text-brand-600 dark:text-brand-300">
                      {i + 1}
                    </span>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{step}</p>
                  </li>
                ))}
              </ol>
            </Card>
          )}
        </div>

        {/* Compatibility sidebar */}
        <div>
          <Card title="Compatible models">
            {part.compatibleVehicleModels.length === 0 ? (
              <p className="text-sm text-slate-500">Compatibility list coming soon.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {part.compatibleVehicleModels.map((m) => (
                  <span
                    key={m}
                    className="rounded-full bg-slate-700/60 px-3 py-1 text-xs text-slate-800 dark:text-slate-200"
                  >
                    {m}
                  </span>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
