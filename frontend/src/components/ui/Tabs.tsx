import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface TabItem {
  key: string;
  label: string;
  icon?: ReactNode;
  count?: number;
}

interface TabsProps {
  items: TabItem[];
  active: string;
  onChange: (key: string) => void;
  variant?: 'underline' | 'pill';
  className?: string;
}

export default function Tabs({ items, active, onChange, variant = 'underline', className }: TabsProps) {
  if (variant === 'pill') {
    return (
      <div className={cn('inline-flex flex-wrap gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80', className)}>
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all',
              active === item.key
                ? 'bg-white text-brand-600 shadow-sm dark:bg-slate-900 dark:text-brand-400'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
            )}
          >
            {item.icon}
            {item.label}
            {typeof item.count === 'number' && (
              <span
                className={cn(
                  'rounded-full px-1.5 text-[11px] font-bold',
                  active === item.key
                    ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400'
                    : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800', className)}>
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onChange(item.key)}
          className={cn(
            'relative inline-flex items-center gap-1.5 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors',
            active === item.key
              ? 'text-brand-600 dark:text-brand-400'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
          )}
        >
          {item.icon}
          {item.label}
          {typeof item.count === 'number' && (
            <span className="rounded-full bg-slate-200 px-1.5 text-[11px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              {item.count}
            </span>
          )}
          {active === item.key && (
            <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-brand-600 to-sky-500" />
          )}
        </button>
      ))}
    </div>
  );
}
