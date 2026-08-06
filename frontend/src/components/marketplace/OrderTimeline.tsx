import { Check, Loader2 } from 'lucide-react';
import type { OrderTimelineStep } from '@/types';
import { cn } from '@/utils/cn';

interface OrderTimelineProps {
  steps: OrderTimelineStep[];
}

/** Vertical order lifecycle timeline (DIY & mechanic installation paths). */
export default function OrderTimeline({ steps }: OrderTimelineProps) {
  return (
    <ol className="relative">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        return (
          <li key={step.key} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast && (
              <span
                aria-hidden
                className={cn(
                  'absolute left-[13px] top-8 h-[calc(100%-2rem)] w-0.5 rounded-full',
                  step.done ? 'bg-emerald-400 dark:bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700',
                )}
              />
            )}

            <span
              className={cn(
                'relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2',
                step.done &&
                  'border-emerald-500 bg-emerald-500 text-white',
                step.current &&
                  'animate-pulse-soft border-brand-500 bg-brand-500/15 text-brand-600 dark:text-brand-400',
                !step.done &&
                  !step.current &&
                  'border-slate-300 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500',
              )}
            >
              {step.done ? (
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              ) : step.current ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <span className="text-[10px] font-bold">{i + 1}</span>
              )}
            </span>

            <div className="min-w-0 pt-0.5">
              <p
                className={cn(
                  'text-sm font-semibold',
                  step.current
                    ? 'text-brand-700 dark:text-brand-300'
                    : step.done
                      ? 'text-slate-800 dark:text-slate-100'
                      : 'text-slate-400 dark:text-slate-500',
                )}
              >
                {step.label}
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{step.description}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
