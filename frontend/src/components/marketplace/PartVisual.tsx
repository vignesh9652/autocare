import type { LucideIcon } from 'lucide-react';
import { CircleDot, Disc3, Droplets, Filter, Sparkles, Zap } from 'lucide-react';
import type { MarketplacePart } from '@/types';
import { cn } from '@/utils/cn';

interface CategoryStyle {
  gradient: string;
  icon: LucideIcon;
  label: string;
}

/** Category → visual identity used in place of product photography. */
export const PART_CATEGORY_STYLE: Record<string, CategoryStyle> = {
  Lubricants: { gradient: 'from-amber-400 to-orange-500', icon: Droplets, label: 'Lubricants' },
  Filters: { gradient: 'from-sky-400 to-blue-600', icon: Filter, label: 'Filters' },
  Brakes: { gradient: 'from-rose-400 to-red-600', icon: Disc3, label: 'Brakes' },
  Electrical: { gradient: 'from-violet-400 to-purple-600', icon: Zap, label: 'Electrical' },
  Tyres: { gradient: 'from-slate-500 to-slate-800', icon: CircleDot, label: 'Tyres' },
  Accessories: { gradient: 'from-emerald-400 to-teal-600', icon: Sparkles, label: 'Accessories' },
};

const FALLBACK: CategoryStyle = { gradient: 'from-brand-500 to-sky-500', icon: Sparkles, label: 'Spare Parts' };

export function partCategoryStyle(category: string): CategoryStyle {
  return PART_CATEGORY_STYLE[category] ?? FALLBACK;
}

interface PartVisualProps {
  part: Pick<MarketplacePart, 'category'>;
  className?: string;
  iconClassName?: string;
}

/** Stylised "product image" — category icon on a brand gradient. */
export default function PartVisual({ part, className, iconClassName }: PartVisualProps) {
  const { gradient, icon: Icon } = partCategoryStyle(part.category);
  return (
    <div className={cn('flex items-center justify-center bg-gradient-to-br', gradient, className)}>
      <Icon className={cn('text-white/90 drop-shadow-sm', iconClassName)} strokeWidth={1.3} />
    </div>
  );
}
