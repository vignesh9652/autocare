import { useEffect, useMemo, useRef, useState } from 'react';
import { getParts } from '@/api/sparePartsApi';
import { getApiErrorMessage } from '@/api/client';
import { Card, PartCard } from '@/components';
import type { SparePart } from '@/types';

const SEARCH_DEBOUNCE_MS = 400;

export default function Catalog() {
  const [parts, setParts] = useState<SparePart[]>([]);
  const [allParts, setAllParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtersActive = Boolean(debouncedSearch || category);

  // Debounce the search input (400ms) before hitting the API.
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search]);

  // Initial load: full catalog, seeds both the grid and the category options.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const all = await getParts();
        if (!cancelled) {
          setAllParts(all);
          setParts(all);
        }
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Failed to load spare parts'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(allParts.map((p) => p.category))).sort(),
    [allParts],
  );

  // Filtered loads — each run cancels the previous one to avoid stale responses.
  useEffect(() => {
    if (!filtersActive) {
      setParts(allParts);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError('');
    getParts({ search: debouncedSearch || undefined, category: category || undefined })
      .then((list) => {
        if (!cancelled) setParts(list);
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, 'Failed to load spare parts'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, category, filtersActive, allParts]);

  return (
    <div className="container-page py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Spare Parts Catalog</h1>
        <p className="mt-1 text-sm text-slate-400">
          Genuine parts with compatibility and DIY install guides
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="cat-search">Search</label>
          <input
            id="cat-search"
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or description…"
          />
        </div>
        <div>
          <label className="label" htmlFor="cat-category">Category</label>
          <select
            id="cat-category"
            className="input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card h-40 animate-pulse bg-slate-800/50" />
          ))}
        </div>
      ) : parts.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="text-4xl" aria-hidden>🔩</p>
          <p className="mt-3 text-slate-400">No parts found{search || category ? ' for your filters' : ''}.</p>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {parts.map((p) => (
            <PartCard key={p.id} part={p} />
          ))}
        </div>
      )}
    </div>
  );
}
