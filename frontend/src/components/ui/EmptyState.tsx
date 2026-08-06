import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={className}>
      <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-500">
            {icon ?? <Inbox className="h-9 w-9" />}
          </div>
          <span className="absolute -right-1.5 -top-1.5 h-3.5 w-3.5 animate-pulse-soft rounded-full border-2 border-white bg-brand-400 dark:border-slate-900" />
        </div>
        <h3 className="mt-5 text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        {description && (
          <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>
        )}
        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
  );
}
