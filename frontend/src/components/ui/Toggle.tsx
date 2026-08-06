import { cn } from '@/utils/cn';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export default function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className,
}: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'group flex w-full items-center justify-between gap-4 rounded-xl px-4 py-3 text-left transition-colors',
        !disabled && 'hover:bg-slate-50 dark:hover:bg-slate-800/60',
        disabled && 'cursor-not-allowed opacity-60',
        className,
      )}
    >
      {(label || description) && (
        <span className="min-w-0">
          {label && (
            <span className="block text-sm font-medium text-slate-800 dark:text-slate-100">{label}</span>
          )}
          {description && (
            <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{description}</span>
          )}
        </span>
      )}
      <span
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200',
          checked ? 'bg-gradient-to-r from-brand-600 to-sky-500' : 'bg-slate-300 dark:bg-slate-700',
        )}
      >
        <span
          className={cn(
            'inline-block transform rounded-full bg-white shadow transition-transform duration-200',
            checked ? 'translate-x-[1.4rem]' : 'translate-x-1',
          )}
          style={{ height: '1.125rem', width: '1.125rem' }}
        />
      </span>
    </button>
  );
}
