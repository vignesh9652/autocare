import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function KpiCard({
  label,
  value,
  icon,
  accent = 'brand',
  hint,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  accent?: 'brand' | 'emerald' | 'amber' | 'violet' | 'sky' | 'rose';
  hint?: string;
}) {
  const accents: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400',
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="card p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</p>
          <p className="mt-2 text-2xl font-extrabold text-ink-900 dark:text-ink-100">{value}</p>
          {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
        </div>
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl', accents[accent])}>{icon}</div>
      </div>
    </motion.div>
  );
}
