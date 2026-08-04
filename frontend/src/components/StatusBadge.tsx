type Status = string | null | undefined;

interface StatusBadgeProps {
  status: Status;
  label?: string;
}

/**
 * Map a backend status string to Tailwind classes.
 *
 * Booking statuses follow the requested palette:
 *   PENDING=yellow, ACCEPTED=blue, IN_PROGRESS=purple,
 *   COMPLETED=green, CANCELLED=gray
 * Payment / recommendation / availability statuses reuse nearby colors.
 */
function colorFor(status: Status): string {
  const s = status?.toUpperCase() ?? '';

  // Green — positive / done
  if (['SUCCESS', 'COMPLETED', 'AVAILABLE', 'APPROVED', 'UP', 'IN STOCK'].includes(s)) {
    return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  }
  // Blue — accepted / in flow
  if (['ACCEPTED', 'ORDERED'].includes(s)) {
    return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
  }
  // Purple — actively being worked on
  if (['IN_PROGRESS'].includes(s)) {
    return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
  }
  // Yellow — waiting
  if (['PENDING', 'INITIATED', 'RECOMMENDED', 'BUSY'].includes(s)) {
    return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
  }
  // Red — failed / rejected
  if (['FAILED', 'REJECTED', 'LOW STOCK', 'OUT OF STOCK'].includes(s)) {
    return 'bg-red-500/15 text-red-400 border-red-500/30';
  }
  // Gray — terminal / offline / unknown
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
