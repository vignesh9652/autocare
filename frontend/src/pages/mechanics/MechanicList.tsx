import { useEffect, useMemo, useRef, useState } from 'react';
import { getMechanics } from '@/api/mechanicApi';
import { getApiErrorMessage } from '@/api/client';
import { Card, MechanicCard, Spinner } from '@/components';
import type { Mechanic } from '@/types';

const AREA_DEBOUNCE_MS = 400;

export default function MechanicList() {
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [allMechanics, setAllMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [skill, setSkill] = useState('');
  const [area, setArea] = useState('');
  const [debouncedArea, setDebouncedArea] = useState('');
  const areaTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtersActive = Boolean(skill || debouncedArea);

  // Debounce the area text input (400ms) before it hits the API.
  useEffect(() => {
    if (areaTimer.current) clearTimeout(areaTimer.current);
    areaTimer.current = setTimeout(() => setDebouncedArea(area), AREA_DEBOUNCE_MS);
    return () => {
      if (areaTimer.current) clearTimeout(areaTimer.current);
    };
  }, [area]);

  // Initial load: full roster, seeds both the grid and the skill dropdown.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const all = await getMechanics();
        if (!cancelled) {
          setAllMechanics(all);
          setMechanics(all);
        }
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Failed to load mechanics'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const skillOptions = useMemo(
    () => Array.from(new Set(allMechanics.flatMap((m) => m.skills))).sort(),
    [allMechanics],
  );

  // Filtered loads — each run cancels the previous one to avoid stale responses.
  useEffect(() => {
    if (!filtersActive) {
      setMechanics(allMechanics);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError('');
    getMechanics({ skill: skill || undefined, area: debouncedArea || undefined })
      .then((list) => {
        if (!cancelled) setMechanics(list);
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, 'Failed to load mechanics'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [skill, debouncedArea, filtersActive, allMechanics]);

  return (
    <div className="container-page py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Find a Mechanic</h1>
        <p className="mt-1 text-sm text-slate-400">
          Browse vetted mechanics by skill and service area
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="m-skill">Skill</label>
          <select
            id="m-skill"
            className="input"
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
          >
            <option value="">All skills</option>
            {skillOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="m-area">Service Area</label>
          <input
            id="m-area"
            className="input"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="e.g. Bengaluru, Mumbai…"
          />
        </div>
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
          <p className="text-4xl" aria-hidden>🔧</p>
          <p className="mt-3 text-slate-400">No mechanics match your filters.</p>
          <p className="mt-1 text-sm text-slate-500">Try widening the skill or area.</p>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {mechanics.map((m) => (
            <MechanicCard key={m.id} mechanic={m} />
          ))}
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-400">
        <span className="font-semibold text-slate-300">ℹ️ How assignment works</span> — you don't
        choose a mechanic here. When you create a booking, an available mechanic matching your
        service type, required skill and area is assigned automatically.
      </div>
    </div>
  );
}
