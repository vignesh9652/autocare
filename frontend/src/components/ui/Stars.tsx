import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Stars({
  rating,
  size = 16,
  interactive,
  onChange,
}: {
  rating: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          className={cn('transition', interactive && 'hover:scale-110')}
        >
          <Star
            style={{ width: size, height: size }}
            className={cn(
              star <= Math.round(rating)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-ink-100 text-ink-200 dark:fill-ink-800 dark:text-ink-700'
            )}
          />
        </button>
      ))}
    </div>
  );
}
