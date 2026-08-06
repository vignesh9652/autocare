import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  icon?: ReactNode;
}

export default function PageHeader({ title, subtitle, actions, icon }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3.5">
        {icon && (
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-sky-500 text-white shadow-md shadow-brand-600/20">
            {icon}
          </span>
        )}
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            {title}
          </h1>
          {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}
