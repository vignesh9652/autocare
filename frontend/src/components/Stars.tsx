interface StarsProps {
  value: number;
  size?: 'sm' | 'md';
  className?: string;
}

const SIZE_CLASS = {
  sm: 'text-sm',
  md: 'text-lg',
};

/** Read-only 5-star display (filled vs. empty). */
export default function Stars({ value, size = 'md', className = '' }: StarsProps) {
  const rounded = Math.round(value);
  return (
    <span
      className={`inline-flex items-center ${SIZE_CLASS[size]} ${className}`}
      role="img"
      aria-label={`${value} out of 5 stars`}
    >
      <span className="text-amber-400" aria-hidden>
        {'★'.repeat(Math.max(0, Math.min(5, rounded)))}
      </span>
      <span className="text-slate-300 dark:text-slate-600" aria-hidden>
        {'★'.repeat(Math.max(0, 5 - rounded))}
      </span>
    </span>
  );
}
