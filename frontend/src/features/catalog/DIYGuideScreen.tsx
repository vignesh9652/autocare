import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Gauge,
  ShieldAlert,
  Wrench,
  X,
} from 'lucide-react';
import { diyApi, partsApi } from '@/lib/api';
import { assetUrl, partImageUrl } from '@/lib/images';
import { Button } from '@/components/ui/Button';
import { EmptyState, LoadingScreen } from '@/components/ui/Feedback';
import { cn } from '@/lib/utils';
import { DifficultyLevel } from '@/types';

const DIFFICULTY_STYLES: Record<DifficultyLevel, string> = {
  EASY: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:ring-emerald-500/25',
  MEDIUM: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:ring-amber-500/25',
  HARD: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/15 dark:text-red-400 dark:ring-red-500/25',
};

export function DIYGuideScreen() {
  const { id } = useParams<{ id: string }>();
  const partId = Number(id);
  const [stepIndex, setStepIndex] = useState(0);

  const { data: guide, isLoading, isError } = useQuery({
    queryKey: ['part-diy', id],
    queryFn: () => diyApi.getForPart(partId),
    enabled: !!id,
    retry: false,
  });

  const { data: part } = useQuery({
    queryKey: ['part', id],
    queryFn: () => partsApi.get(partId),
    enabled: !!id,
  });

  if (isLoading) return <LoadingScreen label="Loading DIY guide…" />;

  if (isError || !guide) {
    return (
      <div className="container-app py-16">
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          title="No DIY guide yet"
          description="This spare part doesn't have a published DIY guide yet. You can still buy it or have an AutoCare mechanic install it."
          action={
            part?.mechanicInstallationAvailable !== false ? (
              <Link to={`/parts/${partId}/install`}><Button>Book a Mechanic</Button></Link>
            ) : (
              <Link to={`/parts/${partId}`}><Button>Back to part</Button></Link>
            )
          }
        />
      </div>
    );
  }

  const steps = guide.steps ?? [];
  const completed = stepIndex >= steps.length;
  const current = steps[stepIndex];

  const goNext = () => setStepIndex((i) => Math.min(i + 1, steps.length));
  const goPrev = () => setStepIndex((i) => Math.max(i - 1, 0));

  return (
    <div className="container-app py-10">
      <Link to={`/parts/${partId}`} className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Back to {part?.name ?? 'part'}
      </Link>

      {/* Header */}
      <div className="card overflow-hidden">
        <div className="flex flex-col gap-4 bg-gradient-to-r from-ink-900 to-ink-800 px-6 py-6 text-white sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-300">DIY Installation Guide</p>
            <h1 className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">{guide.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className={cn('inline-flex items-center gap-1 rounded-full px-3 py-1 ring-1', DIFFICULTY_STYLES[guide.difficultyLevel])}>
                <Gauge className="h-3.5 w-3.5" /> {guide.difficultyLevel}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-white ring-1 ring-white/20">
                <Clock className="h-3.5 w-3.5" /> ~{guide.estimatedTimeMinutes} min
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-white ring-1 ring-white/20">
                {steps.length} {steps.length === 1 ? 'step' : 'steps'}
              </span>
            </div>
          </div>
          <img
            src={partImageUrl(part?.category ?? 'parts', part?.imageUrl)}
            alt={part?.name ?? 'spare part'}
            className="h-24 w-24 shrink-0 rounded-2xl object-cover ring-2 ring-white/20"
          />
        </div>

        {guide.description && (
          <p className="border-b border-ink-100 px-6 py-4 text-sm leading-relaxed text-ink-600 dark:border-ink-800 dark:text-ink-300 sm:px-8">
            {guide.description}
          </p>
        )}

        <div className="grid gap-6 px-6 py-6 sm:px-8 lg:grid-cols-2">
          {/* Required tools */}
          {guide.requiredTools.length > 0 && (
            <div className="rounded-2xl bg-ink-50 p-5 dark:bg-ink-800/50">
              <p className="mb-3 text-sm font-bold text-ink-900 dark:text-ink-100">Required Tools</p>
              <ul className="space-y-2">
                {guide.requiredTools.map((tool) => (
                  <li key={tool} className="flex items-center gap-2 text-sm text-ink-700 dark:text-ink-300">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                      <Check className="h-3 w-3" />
                    </span>
                    {tool}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Safety warnings */}
          {guide.safetyWarnings.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 dark:border-amber-500/25 dark:bg-amber-500/5">
              <p className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-900 dark:text-ink-100">
                <ShieldAlert className="h-4 w-4 text-amber-500" /> Safety First
              </p>
              <ul className="space-y-2">
                {guide.safetyWarnings.map((warning) => (
                  <li key={warning} className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-300">
                    <span className="mt-0.5 shrink-0">⚠</span>
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {guide.videoUrl && (
          <div className="px-6 pb-6 sm:px-8">
            <a href={guide.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0C.488 3.45.03 5.804.001 12 .03 18.185.484 20.55 4.385 20.816c3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zM10 16V8l6 4-6 4z" /></svg>
              Watch the full video tutorial
            </a>
          </div>
        )}
      </div>

      {/* Step viewer */}
      <div className="mt-8 card p-6 sm:p-8">
        {!completed ? (
          <>
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-ink-400">Installation Steps</p>
                <p className="mt-0.5 text-sm font-semibold text-ink-900 dark:text-ink-100">
                  Step {current.stepNumber} of {steps.length}
                </p>
              </div>
              {/* Progress dots */}
              <div className="flex items-center gap-1.5">
                {steps.map((s, i) => (
                  <span
                    key={s.id}
                    className={cn(
                      'h-2 rounded-full transition-all',
                      i < stepIndex ? 'w-2 bg-emerald-500' : i === stepIndex ? 'w-6 bg-brand-500' : 'w-2 bg-ink-200 dark:bg-ink-700'
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="font-display text-xl font-bold text-ink-900 dark:text-ink-100">{current.title}</h3>
                {current.description ? (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-600 dark:text-ink-300">{current.description}</p>
                ) : (
                  <p className="mt-3 text-sm text-ink-400">No description provided for this step.</p>
                )}
                {current.videoUrl && (
                  <a href={current.videoUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400">
                    ▶ Watch this step
                  </a>
                )}
              </div>
              <div className="h-56 overflow-hidden rounded-2xl bg-ink-50 dark:bg-ink-800/50">
                {current.imageUrl ? (
                  <img src={assetUrl(current.imageUrl)} alt={current.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-ink-300 dark:text-ink-600">
                    <Wrench className="h-10 w-10" />
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="font-display text-2xl font-extrabold text-ink-900 dark:text-ink-100">Installation Guide Completed ✓</h3>
            <p className="mt-2 max-w-md text-sm text-ink-500">
              Great work! You've made it through every step of installing your {part?.name ?? 'spare part'}.
            </p>

            {part?.mechanicInstallationAvailable !== false && (
              <div className="mt-8 w-full max-w-sm rounded-2xl border border-ink-100 bg-ink-50 p-5 dark:border-ink-800 dark:bg-ink-800/50">
                <p className="text-sm font-bold text-ink-900 dark:text-ink-100">Not comfortable doing this yourself?</p>
                <p className="mt-1 text-xs text-ink-500">Let a verified AutoCare mechanic handle the installation for you.</p>
                <Link to={`/parts/${partId}/install`} className="mt-4 block">
                  <Button className="w-full"><Wrench className="h-4 w-4" /> Book a Mechanic</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" onClick={goPrev} disabled={stepIndex === 0}>
          <ArrowLeft className="h-4 w-4" /> Previous
        </Button>
        {!completed ? (
          stepIndex < steps.length - 1 ? (
            <Button onClick={goNext}>Next <ArrowRight className="h-4 w-4" /></Button>
          ) : (
            <Button onClick={goNext}><Check className="h-4 w-4" /> Finish Guide</Button>
          )
        ) : (
          <Link to={`/parts/${partId}`}>
            <Button variant="secondary"><X className="h-4 w-4" /> Close</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
