import Stars from './Stars';
import { formatRating } from '@/utils/format';
import type { Mechanic } from '@/types';

interface MechanicCardProps {
  mechanic: Mechanic;
}

const AVAILABILITY_DOT: Record<string, string> = {
  AVAILABLE: 'bg-emerald-500',
  BUSY: 'bg-amber-500',
  OFFLINE: 'bg-slate-600',
};

const AVAILABILITY_LABEL: Record<string, string> = {
  AVAILABLE: 'Available now',
  BUSY: 'Currently busy',
  OFFLINE: 'Offline',
};

/** Browse-only mechanic card: skills, area, availability dot, rating, jobs done. */
export default function MechanicCard({ mechanic: m }: MechanicCardProps) {
  const dot = AVAILABILITY_DOT[m.availabilityStatus] ?? 'bg-slate-600';
  const label = AVAILABILITY_LABEL[m.availabilityStatus] ?? m.availabilityStatus;

  return (
    <div className="card card-hover flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-600/20 text-lg font-bold text-brand-600 dark:text-brand-300">
            {m.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{m.name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">📍 {m.serviceArea}</p>
          </div>
        </div>

        {/* Availability dot */}
        <span
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300"
          title={label}
        >
          <span className={`h-2.5 w-2.5 rounded-full ${dot}`} aria-hidden />
          {m.availabilityStatus === 'AVAILABLE' ? 'Available' : m.availabilityStatus.toLowerCase()}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {m.skills.map((s) => (
          <span key={s} className="rounded-full bg-slate-700/60 px-2.5 py-0.5 text-xs text-slate-700 dark:text-slate-300">
            {s}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-slate-700/50 pt-3 text-sm">
        <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
          <Stars value={m.averageRating ?? 0} size="sm" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">{formatRating(m.averageRating)}</span>
        </span>
        <span className="text-xs text-slate-500">{m.totalJobsCompleted} jobs completed</span>
      </div>
    </div>
  );
}
