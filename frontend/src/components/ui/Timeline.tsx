import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface TimelineStep {
  key: string;
  label: string;
  description?: string;
  time?: string;
  done: boolean;
  current?: boolean;
}

export default function Timeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol className="relative">
      {steps.map((step, i) => (
        <li key={step.key} className="relative flex gap-4 pb-6 last:pb-0">
          {i < steps.length - 1 && (
            <span
              className={cn(
                'absolute left-[15px] top-9 h-[calc(100%-2rem)] w-0.5 -translate-x-1/2 rounded-full',
                step.done ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-700',
              )}
            />
          )}
          <span
            className={cn(
              'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
              step.done
                ? 'border-brand-500 bg-gradient-to-br from-brand-600 to-sky-500 text-white'
                : step.current
                  ? 'border-brand-500 bg-white text-brand-600 dark:bg-slate-900 dark:text-brand-400'
                  : 'border-slate-300 bg-white text-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-500',
            )}
          >
            {step.done ? (
              <Check className="h-4 w-4" strokeWidth={3} />
            ) : (
              <span className={cn('h-2 w-2 rounded-full bg-current', step.current && 'animate-pulse')} />
            )}
          </span>
          <div className="min-w-0 pt-1">
            <p
              className={cn(
                'text-sm font-semibold',
                step.done || step.current
                  ? 'text-slate-900 dark:text-slate-100'
                  : 'text-slate-500 dark:text-slate-400',
              )}
            >
              {step.label}
            </p>
            {step.description && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{step.description}</p>
            )}
            {step.time && <p className="mt-0.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">{step.time}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
