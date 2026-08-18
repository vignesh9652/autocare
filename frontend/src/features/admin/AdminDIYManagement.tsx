import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Eye, EyeOff, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { diyApi, partsApi, getErrorMessage } from '@/lib/api';
import { toast } from '@/stores/toast-store';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/ui/Feedback';
import { cn } from '@/lib/utils';
import { DiyGuide, DifficultyLevel } from '@/types';

interface GuideDraft {
  sparePartId: string;
  title: string;
  description: string;
  difficultyLevel: DifficultyLevel;
  estimatedTimeMinutes: string;
  requiredTools: string;
  safetyWarnings: string;
  videoUrl: string;
}

const EMPTY_DRAFT: GuideDraft = {
  sparePartId: '',
  title: '',
  description: '',
  difficultyLevel: 'MEDIUM',
  estimatedTimeMinutes: '30',
  requiredTools: '',
  safetyWarnings: '',
  videoUrl: '',
};

function draftFromGuide(g: DiyGuide): GuideDraft {
  return {
    sparePartId: String(g.sparePartId),
    title: g.title,
    description: g.description ?? '',
    difficultyLevel: g.difficultyLevel,
    estimatedTimeMinutes: String(g.estimatedTimeMinutes),
    requiredTools: (g.requiredTools ?? []).join('\n'),
    safetyWarnings: (g.safetyWarnings ?? []).join('\n'),
    videoUrl: g.videoUrl ?? '',
  };
}

function splitLines(value: string): string[] {
  return value.split('\n').map((s) => s.trim()).filter(Boolean);
}

export function AdminDIYManagement() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['admin-diy'], queryFn: diyApi.listAll });
  const { data: parts } = useQuery({ queryKey: ['admin-parts'], queryFn: () => partsApi.getAll({}), staleTime: 60_000 });

  const [editing, setEditing] = useState<DiyGuide | 'new' | null>(null);
  const [draft, setDraft] = useState<GuideDraft>(EMPTY_DRAFT);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [stepDrafts, setStepDrafts] = useState<Record<number, string>>({});

  const guides = data ?? [];

  const startCreate = () => {
    setDraft(EMPTY_DRAFT);
    setEditing('new');
  };

  const startEdit = (g: DiyGuide) => {
    setDraft(draftFromGuide(g));
    setEditing(g);
  };

  const save = useMutation({
    mutationFn: (g: DiyGuide | 'new') => {
      const payload = {
        sparePartId: Number(draft.sparePartId),
        title: draft.title.trim(),
        description: draft.description.trim() || undefined,
        difficultyLevel: draft.difficultyLevel,
        estimatedTimeMinutes: Number(draft.estimatedTimeMinutes) || 30,
        requiredTools: splitLines(draft.requiredTools),
        safetyWarnings: splitLines(draft.safetyWarnings),
        videoUrl: draft.videoUrl.trim() || undefined,
      };
      return g === 'new' ? diyApi.create(payload) : diyApi.update(g.id, payload);
    },
    onSuccess: (guide, g) => {
      const partId = guide?.sparePartId ?? Number(draft.sparePartId);
      const partName = (parts ?? []).find((p) => p.id === partId)?.name;
      const partLabel = partName ? ` for "${partName}"` : ` for part #${partId}`;
      toast(g === 'new' ? `DIY guide created${partLabel}` : `DIY guide updated${partLabel}`, 'success');
      setEditing(null);
      void qc.invalidateQueries({ queryKey: ['admin-diy'] });
    },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  const publish = useMutation({
    mutationFn: ({ id, publishNow }: { id: number; publishNow: boolean }) =>
      publishNow ? diyApi.publish(id) : diyApi.unpublish(id),
    onSuccess: (_d, v) => {
      toast(v.publishNow ? 'Guide published — customers can now see it' : 'Guide unpublished', 'success');
      void qc.invalidateQueries({ queryKey: ['admin-diy'] });
    },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  const remove = useMutation({
    mutationFn: (id: number) => diyApi.remove(id),
    onSuccess: () => {
      toast('Guide deleted', 'success');
      setExpandedId(null);
      void qc.invalidateQueries({ queryKey: ['admin-diy'] });
    },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  const addStep = useMutation({
    mutationFn: ({ id, title }: { id: number; title: string }) => diyApi.addStep(id, { stepNumber: 999, title, description: undefined }),
    onSuccess: () => {
      toast('Step added', 'success');
      void qc.invalidateQueries({ queryKey: ['admin-diy'] });
    },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  const removeStep = useMutation({
    mutationFn: ({ id, stepId }: { id: number; stepId: number }) => diyApi.removeStep(id, stepId),
    onSuccess: () => {
      toast('Step removed', 'success');
      void qc.invalidateQueries({ queryKey: ['admin-diy'] });
    },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  const canSave = draft.sparePartId !== '' && draft.title.trim().length > 0;

  if (isLoading) return <CardSkeleton count={3} />;
  if (isError) return <ErrorState message="Could not load DIY guides" onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900 dark:text-ink-100">DIY Guide Management</h1>
          <p className="mt-1 text-sm text-ink-500">Create installation guides, add steps and publish them for customers.</p>
        </div>
        <Button onClick={startCreate}><Plus className="h-4 w-4" /> New Guide</Button>
      </div>

      {editing !== null && (
        <div className="card p-5">
          <p className="mb-4 flex items-center gap-2 text-sm font-bold text-ink-900 dark:text-ink-100">
            <BookOpen className="h-4 w-4 text-brand-500" />
            {editing === 'new' ? 'Create DIY guide' : `Edit: ${editing.title}`}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              aria-label="Spare part"
              value={draft.sparePartId}
              onChange={(e) => setDraft((d) => ({ ...d, sparePartId: e.target.value }))}
              className="input sm:col-span-2"
            >
              <option value="">Select spare part…</option>
              {(parts ?? []).map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
              ))}
            </select>
            <input
              aria-label="Title"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="Guide title, e.g. Brake Pad Replacement"
              className="input sm:col-span-2"
            />
            <textarea
              aria-label="Description"
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              placeholder="Short description of the guide"
              rows={2}
              className="input sm:col-span-2"
            />
            <select
              aria-label="Difficulty"
              value={draft.difficultyLevel}
              onChange={(e) => setDraft((d) => ({ ...d, difficultyLevel: e.target.value as DifficultyLevel }))}
              className="input"
            >
              {(['EASY', 'MEDIUM', 'HARD'] as const).map((lvl) => <option key={lvl} value={lvl}>{lvl}</option>)}
            </select>
            <input
              aria-label="Estimated time (minutes)"
              type="number"
              min={1}
              value={draft.estimatedTimeMinutes}
              onChange={(e) => setDraft((d) => ({ ...d, estimatedTimeMinutes: e.target.value }))}
              placeholder="Estimated minutes"
              className="input"
            />
            <textarea
              aria-label="Required tools (one per line)"
              value={draft.requiredTools}
              onChange={(e) => setDraft((d) => ({ ...d, requiredTools: e.target.value }))}
              placeholder="Required tools (one per line)&#10;e.g. Socket wrench"
              rows={3}
              className="input sm:col-span-2"
            />
            <textarea
              aria-label="Safety warnings (one per line)"
              value={draft.safetyWarnings}
              onChange={(e) => setDraft((d) => ({ ...d, safetyWarnings: e.target.value }))}
              placeholder="Safety warnings (one per line)&#10;e.g. Park on a flat surface"
              rows={3}
              className="input sm:col-span-2"
            />
            <input
              aria-label="Video URL"
              value={draft.videoUrl}
              onChange={(e) => setDraft((d) => ({ ...d, videoUrl: e.target.value }))}
              placeholder="Full video tutorial URL (optional)"
              className="input sm:col-span-2"
            />
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => save.mutate(editing)} loading={save.isPending} disabled={!canSave}>
              <Save className="h-4 w-4" /> Save Guide
            </Button>
            <Button variant="ghost" onClick={() => setEditing(null)}><X className="h-4 w-4" /> Cancel</Button>
          </div>
        </div>
      )}

      {guides.length === 0 && editing === null ? (
        <EmptyState icon={<BookOpen className="h-6 w-6" />} title="No DIY guides yet" description="Create a guide to let customers install spare parts themselves." action={<Button onClick={startCreate}><Plus className="h-4 w-4" /> New Guide</Button>} />
      ) : (
        <div className="space-y-3">
          {guides.map((g) => (
            <div key={g.id} className="card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-ink-900 dark:text-ink-100">{g.title}</p>
                    {g.status === 'PUBLISHED' ? <Badge variant="success">Published</Badge> : <Badge variant="neutral">Draft</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-ink-400">
                    Spare part #{g.sparePartId} · {g.difficultyLevel} · ~{g.estimatedTimeMinutes} min · {g.steps.length} steps
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {g.status === 'DRAFT' ? (
                    <Button size="sm" variant="outline" onClick={() => publish.mutate({ id: g.id, publishNow: true })} loading={publish.isPending && publish.variables?.id === g.id}>
                      <Eye className="h-4 w-4" /> Publish
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => publish.mutate({ id: g.id, publishNow: false })}>
                      <EyeOff className="h-4 w-4" /> Unpublish
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => { startEdit(g); setExpandedId(g.id); }}>
                    <Pencil className="h-4 w-4" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { if (window.confirm(`Delete guide "${g.title}"?`)) remove.mutate(g.id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <button
                className="flex w-full items-center justify-between border-t border-ink-100 px-5 py-3 text-left text-xs font-semibold text-ink-500 hover:bg-ink-50 dark:border-ink-800 dark:hover:bg-ink-900/40"
                onClick={() => setExpandedId(expandedId === g.id ? null : g.id)}
              >
                <span>Installation steps ({g.steps.length})</span>
                <span>{expandedId === g.id ? 'Hide ▲' : 'Show ▼'}</span>
              </button>

              {expandedId === g.id && (
                <div className="space-y-2 border-t border-ink-100 p-5 dark:border-ink-800">
                  {(g.steps ?? []).map((s, i) => (
                    <div key={s.id} className="flex items-start justify-between gap-3 rounded-xl bg-ink-50 px-4 py-3 dark:bg-ink-800/50">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">
                          Step {i + 1} · {s.title}
                        </p>
                        {s.description && <p className="mt-0.5 text-xs text-ink-500">{s.description}</p>}
                        {(s.imageUrl || s.videoUrl) && (
                          <p className="mt-0.5 text-[11px] text-ink-400">
                            {s.imageUrl && '🖼 image'} {s.videoUrl && '▶ video'}
                          </p>
                        )}
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => removeStep.mutate({ id: g.id, stepId: s.id })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-1">
                    <input
                      aria-label={`New step title for ${g.title}`}
                      placeholder="New step title, e.g. Remove the wheel"
                      value={stepDrafts[g.id] ?? ''}
                      onChange={(e) => setStepDrafts((d) => ({ ...d, [g.id]: e.target.value }))}
                      className="input flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        const title = (stepDrafts[g.id] ?? '').trim();
                        if (!title) return;
                        addStep.mutate({ id: g.id, title });
                        setStepDrafts((d) => ({ ...d, [g.id]: '' }));
                      }}
                      loading={addStep.isPending}
                    >
                      <Plus className="h-4 w-4" /> Add Step
                    </Button>
                  </div>
                  <p className={cn('pt-1 text-[11px] text-ink-400')}>
                    Tip: after saving, edit the guide and re-order steps by step number. Step images/videos can be linked from the part's installation data.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
