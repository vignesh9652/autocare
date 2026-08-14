import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="mb-8 flex items-center gap-0">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className={cn('flex items-center', i < steps.length - 1 && 'flex-1')}>
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition',
                  done && 'border-emerald-500 bg-emerald-500 text-white',
                  active && 'border-brand-500 bg-brand-500 text-white',
                  !done && !active && 'border-ink-200 text-ink-400 dark:border-ink-700'
                )}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  'mt-1.5 hidden text-xs font-medium sm:block',
                  active ? 'text-brand-600 dark:text-brand-400' : 'text-ink-400'
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn('mx-2 h-0.5 flex-1 rounded-full transition', done || active ? 'bg-brand-400' : 'bg-ink-200 dark:bg-ink-700')} />
            )}
          </div>
        );
      })}
    </div>
  );
}
