type Status = string | null | undefined;

interface StatusBadgeProps {
  status: Status;
  label?: string;
}

/**
 * Map a backend status string to Tailwind classes (light-first + dark variants).
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
    return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30';
  }
  // Blue — accepted / in flow
  if (['ACCEPTED', 'ORDERED'].includes(s)) {
    return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/30';
  }
  // Purple — actively being worked on
  if (['IN_PROGRESS'].includes(s)) {
    return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30';
  }
  // Yellow — waiting
  if (['PENDING', 'INITIATED', 'RECOMMENDED', 'BUSY'].includes(s)) {
    return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30';
  }
  // Red — failed / rejected
  if (['FAILED', 'REJECTED', 'LOW STOCK', 'OUT OF STOCK'].includes(s)) {
    return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30';
  }
  // Gray — terminal / offline / unknown
  return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/15 dark:text-slate-400 dark:border-slate-500/30';
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
