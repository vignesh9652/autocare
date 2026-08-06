import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface DropdownItem {
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  danger?: boolean;
  divider?: boolean;
  disabled?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  width?: string;
  itemClassName?: string;
}

export default function Dropdown({
  trigger,
  items,
  align = 'right',
  width = 'w-56',
  itemClassName,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            'animate-scale-in absolute z-50 mt-2 origin-top overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-card',
            align === 'right' ? 'right-0' : 'left-0',
            width,
          )}
        >
          {items.map((item, i) => (
            <div key={i}>
              {item.divider && <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" />}
              <button
                onClick={() => {
                  if (item.disabled) return;
                  setOpen(false);
                  item.onClick?.();
                }}
                disabled={item.disabled}
                className={cn(
                  'flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm transition-colors',
                  item.disabled
                    ? 'cursor-not-allowed opacity-50'
                    : item.danger
                      ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10'
                      : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800',
                  itemClassName,
                )}
              >
                {item.icon && <span className="shrink-0 opacity-70">{item.icon}</span>}
                {item.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
