import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  FileText,
  ShieldAlert,
  ShoppingCart,
  Wrench,
  XCircle,
} from 'lucide-react';
import Button from '@/components/Button';
import Badge from '@/components/ui/Badge';
import PartVisual from '@/components/marketplace/PartVisual';
import { useCart } from '@/context/MarketplaceStore';
import { useToast } from '@/components/ui/Toast';
import { useApiData } from '@/hooks/useApiData';
import { getPart } from '@/api/sparePartsApi';
import { toMarketplacePart } from '@/utils/apiMappers';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { InstallationDifficulty } from '@/types';

const DIFFICULTY_VARIANT: Record<InstallationDifficulty, 'success' | 'warning' | 'danger'> = {
  Easy: 'success',
  Moderate: 'warning',
  Expert: 'danger',
};

export default function InstallationGuide() {
  const { id } = useParams<{ id: string }>();
  const partData = useApiData(() => getPart(Number(id)), [id]);
  const part = useMemo(
    () => (partData.data ? toMarketplacePart(partData.data) : undefined),
    [partData.data],
  );
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const { add } = useCart();
  const { success } = useToast();
  const navigate = useNavigate();

  if (!part) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {partData.loading ? 'Loading guide…' : 'Part not found.'}
        </p>
        <Link to="/customer/parts" className="mt-2 inline-block text-sm font-semibold">
          ← Back to marketplace
        </Link>
      </div>
    );
  }

  const guide = part.guide;
  const toggle = (item: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });

  const checklistDone = checked.size;
  const checklistTotal = guide.inspectionChecklist.length;

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <Link to="/customer/parts" className="font-medium hover:text-brand-600 dark:hover:text-brand-400">
          Marketplace
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link
          to={`/customer/parts/${part.id}`}
          className="font-medium hover:text-brand-600 dark:hover:text-brand-400"
        >
          {part.name}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-semibold text-slate-700 dark:text-slate-200">Installation Guide</span>
      </nav>

      {/* Hero */}
      <div className="card overflow-hidden">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <PartVisual part={part} className="h-20 w-20 shrink-0 rounded-2xl" iconClassName="h-10 w-10" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-500">
              DIY Installation Guide
            </p>
            <h1 className="mt-0.5 text-lg font-extrabold text-slate-900 dark:text-white">
              How to install your {part.name}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{part.brand} · {part.oemNumber}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Badge variant={DIFFICULTY_VARIANT[guide.difficulty]} dot>
              {guide.difficulty}
            </Badge>
            <Badge variant="info" dot>
              <Clock3 className="h-3 w-3" /> {guide.estimatedTime}
            </Badge>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 dark:divide-slate-800 dark:border-slate-800">
          {[
            { icon: Wrench, label: 'Tools needed', value: `${guide.tools.length}` },
            { icon: Clock3, label: 'Est. time', value: guide.estimatedTime },
            { icon: ShieldAlert, label: 'Safety notes', value: `${guide.safetyPrecautions.length}` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="px-4 py-3 text-center">
              <Icon className="mx-auto h-4 w-4 text-brand-500" />
              <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">{value}</p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Steps */}
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
              <FileText className="h-4 w-4 text-brand-500" /> Step-by-step instructions
            </h2>
            {guide.steps.length === 0 ? (
              <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                Step-by-step instructions are not available yet for this part — refer to the
                manufacturer manual or an AutoCare mechanic.
              </p>
            ) : (
              <ol className="mt-5 space-y-3">
                {guide.steps.map((step, i) => (
                  <li
                    key={step.title}
                    className="flex gap-4 rounded-xl border border-slate-200 p-4 transition-colors hover:border-brand-300 dark:border-slate-700 dark:hover:border-brand-500/40"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-sky-500 text-xs font-bold text-white shadow-sm">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{step.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                        {step.detail}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* Tools */}
          <div className="card p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
              <Wrench className="h-4 w-4 text-brand-500" /> Required tools
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {guide.tools.map((tool) => (
                <span
                  key={tool}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>

          {/* Safety */}
          <div className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10">
            <div className="flex items-center gap-2 border-b border-amber-200/70 px-5 py-3 dark:border-amber-500/20">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h2 className="text-sm font-bold text-amber-800 dark:text-amber-300">Safety precautions</h2>
            </div>
            <ul className="space-y-2.5 p-5">
              {guide.safetyPrecautions.map((tip) => (
                <li key={tip} className="flex items-start gap-2.5 text-sm text-amber-800 dark:text-amber-200/90">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Common mistakes */}
          <div className="card p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
              <XCircle className="h-4 w-4 text-red-500" /> Common mistakes to avoid
            </h2>
            <ul className="mt-4 space-y-2.5">
              {guide.commonMistakes.map((mistake) => (
                <li
                  key={mistake}
                  className="flex items-start gap-2.5 rounded-xl bg-red-50 px-3.5 py-2.5 text-xs leading-relaxed text-red-700 dark:bg-red-500/10 dark:text-red-300"
                >
                  <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {mistake}
                </li>
              ))}
            </ul>
          </div>

          {/* Checklist */}
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                <ClipboardCheck className="h-4 w-4 text-emerald-500" /> Final inspection
              </h2>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {checklistDone}/{checklistTotal}
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                style={{ width: `${(checklistDone / Math.max(1, checklistTotal)) * 100}%` }}
              />
            </div>
            <div className="mt-4 space-y-2">
              {guide.inspectionChecklist.map((item) => {
                const done = checked.has(item);
                return (
                  <button
                    key={item}
                    onClick={() => toggle(item)}
                    className={cn(
                      'flex w-full items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-xs leading-relaxed transition-all',
                      done
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300'
                        : 'border-slate-200 text-slate-600 hover:border-brand-300 dark:border-slate-700 dark:text-slate-300 dark:hover:border-brand-500/40',
                    )}
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                        done
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-slate-300 dark:border-slate-600',
                      )}
                    >
                      {done && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    {item}
                  </button>
                );
              })}
            </div>
            {checklistDone === checklistTotal && (
              <p className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                <Check className="h-4 w-4" /> All checks passed — well done!
              </p>
            )}
          </div>

          {/* Buy CTA */}
          <div className="card sticky top-20 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">This part</p>
                <p className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {formatCurrency(part.price)}
                </p>
              </div>
              <Badge variant={DIFFICULTY_VARIANT[part.difficulty]}>{part.difficulty}</Badge>
            </div>
            <div className="mt-4 space-y-2">
              <Button
                className="w-full"
                onClick={() => {
                  add(part);
                  success('Added to cart', part.name);
                  navigate('/customer/parts');
                }}
              >
                <ShoppingCart className="h-4 w-4" /> Add to Cart
              </Button>
              <Button variant="secondary" className="w-full" onClick={() => navigate(`/customer/parts/${part.id}`)}>
                <ArrowLeft className="h-4 w-4" /> Back to Part
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
