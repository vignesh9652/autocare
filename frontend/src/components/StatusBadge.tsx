type Status = string | null | undefined;

interface StatusBadgeProps {
  status: Status;
  label?: string;
}

/** Map a backend status string to Tailwind classes. */
function colorFor(status: Status): string {
  const s = status?.toUpperCase() ?? '';
  if (['SUCCESS', 'COMPLETED', 'ACCEPTED', 'AVAILABLE', 'APPROVED', 'ORDERED', 'UP'].includes(s)) {
    return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  }
  if (['PENDING', 'INITIATED', 'RECOMMENDED', 'IN_PROGRESS', 'BUSY'].includes(s)) {
    return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
  }
  if (['FAILED', 'CANCELLED', 'REJECTED', 'OFFLINE', 'DOWN'].includes(s)) {
    return 'bg-red-500/15 text-red-400 border-red-500/30';
  }
  return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  if (!status) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${colorFor(status)}`}
    >
      {label ?? status.toLowerCase()}
    </span>
  );
}
