import { cn } from '@/utils/cn';

type ProgressVariant = 'brand' | 'success' | 'warning' | 'danger';

const BAR_COLORS: Record<ProgressVariant, string> = {
  brand: 'bg-gradient-to-r from-brand-600 to-sky-500',
  success: 'bg-gradient-to-r from-emerald-500 to-teal-500',
  warning: 'bg-gradient-to-r from-amber-500 to-orange-500',
  danger: 'bg-gradient-to-r from-rose-500 to-red-500',
};

interface ProgressBarProps {
  value: number; // 0..100
  variant?: ProgressVariant;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export default function ProgressBar({
  value,
  variant = 'brand',
  size = 'md',
  showLabel = false,
  label,
  className,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between gap-2">
        {label && <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{label}</span>}
        {showLabel && (
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {Math.round(clamped)}%
          </span>
        )}
      </div>
      <div
        className={cn(
          'mt-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800',
          size === 'sm' ? 'h-1.5' : 'h-2.5',
        )}
      >
        <div
          className={cn('h-full rounded-full transition-all duration-700 ease-out', BAR_COLORS[variant])}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
