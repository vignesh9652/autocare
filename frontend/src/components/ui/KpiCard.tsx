import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/utils/cn';

type Accent = 'brand' | 'emerald' | 'amber' | 'rose' | 'violet' | 'sky';

const ACCENTS: Record<Accent, string> = {
  brand: 'bg-gradient-to-br from-brand-600 to-sky-500 text-white',
  emerald: 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white',
  amber: 'bg-gradient-to-br from-amber-500 to-orange-500 text-white',
  rose: 'bg-gradient-to-br from-rose-500 to-pink-500 text-white',
  violet: 'bg-gradient-to-br from-violet-500 to-purple-500 text-white',
  sky: 'bg-gradient-to-br from-sky-500 to-cyan-500 text-white',
};

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  accent?: Accent;
  /** Percentage change vs. previous period. Positive = up. */
  trend?: number;
  trendLabel?: string;
  sub?: string;
  loading?: boolean;
}

export default function KpiCard({
  label,
  value,
  icon,
  accent = 'brand',
  trend,
  trendLabel = 'vs last month',
  sub,
  loading = false,
}: KpiCardProps) {
  const up = (trend ?? 0) >= 0;
  return (
    <div className="card card-hover group relative overflow-hidden p-5">
      {/* Decorative glow */}        <div
          className={cn(
            'pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-25',
            ACCENTS[accent],
          )}
        />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {label}
          </p>
          {loading ? (
            <div className="mt-2 h-8 w-24 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
          ) : (
            <p className="mt-1.5 truncate text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {value}
            </p>
          )}
          <div className="mt-1.5 flex items-center gap-1.5">
            {typeof trend === 'number' && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold',
                  up
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'
                    : 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400',
                )}
              >
                {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(trend).toFixed(1)}%
              </span>
            )}
            <span className="truncate text-[11px] text-slate-400 dark:text-slate-500">{trendLabel}</span>
          </div>
          {sub && <p className="mt-1 truncate text-[11px] text-slate-400 dark:text-slate-500">{sub}</p>}
        </div>
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-md transition-transform duration-200 group-hover:scale-110',
            ACCENTS[accent],
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
