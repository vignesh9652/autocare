import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  hoverable?: boolean;
  className?: string;
  children: ReactNode;
}

export default function Card({
  title,
  subtitle,
  actions,
  hoverable = false,
  className = '',
  children,
}: CardProps) {
  return (
    <div className={`card ${hoverable ? 'card-hover' : ''} p-5 ${className}`}>
      {(title || actions) && (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            {title && (
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
            )}
            {subtitle && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}
