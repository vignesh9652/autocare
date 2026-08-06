import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export type BadgeVariant = 'success' | 'info' | 'warning' | 'danger' | 'neutral' | 'brand';

const VARIANTS: Record<BadgeVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30',
  info: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/30',
  warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30',
  danger: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30',
  neutral: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/15 dark:text-slate-400 dark:border-slate-500/30',
  brand: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-brand-500/15 dark:text-brand-400 dark:border-brand-500/30',
};

const DOTS: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500',
  info: 'bg-sky-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  neutral: 'bg-slate-400',
  brand: 'bg-blue-500',
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  dot?: boolean;
  className?: string;
}

export default function Badge({ variant = 'neutral', children, dot = false, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize whitespace-nowrap',
        VARIANTS[variant],
        className,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', DOTS[variant])} />}
      {children}
    </span>
  );
}
