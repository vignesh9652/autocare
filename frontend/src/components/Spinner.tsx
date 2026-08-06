interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-[3px]',
  lg: 'h-12 w-12 border-4',
};

export default function Spinner({ size = 'md', label, className = '' }: SpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`} role="status">
      <span
        aria-hidden
        className={`${SIZE_CLASSES[size]} animate-spin rounded-full border-brand-500 border-t-transparent`}
      />
      {label && <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>}
    </div>
  );
}
