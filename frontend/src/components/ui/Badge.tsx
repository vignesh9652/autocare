import { cn } from '@/lib/utils';

type Variant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple' | 'neutral';

const styles: Record<Variant, string> = {
  default: 'bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-300',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  error: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
  neutral: 'bg-ink-50 text-ink-500 dark:bg-ink-800/60 dark:text-ink-400',
};

export function Badge({ variant = 'default', children, className }: { variant?: Variant; children: React.ReactNode; className?: string }) {
  return <span className={cn('badge', styles[variant], className)}>{children}</span>;
}

// Status -> variant mapping for domain enums
const booking: Record<string, Variant> = {
  PENDING: 'warning', ACCEPTED: 'info', IN_PROGRESS: 'purple', COMPLETED: 'success',
  PAYMENT_PENDING: 'warning', PAID: 'success', REJECTED: 'error', CANCELLED: 'error',
};
const payment: Record<string, Variant> = { INITIATED: 'warning', SUCCESS: 'success', FAILED: 'error' };
const availability: Record<string, Variant> = { AVAILABLE: 'success', BUSY: 'warning', OFFLINE: 'neutral' };
const account: Record<string, Variant> = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'error' };
const recommendation: Record<string, Variant> = { RECOMMENDED: 'info', APPROVED: 'success', REJECTED: 'error', ORDERED: 'purple' };
const role: Record<string, Variant> = { ADMIN: 'purple', MECHANIC: 'info', CUSTOMER: 'default' };

export function StatusBadge({ kind, status }: { kind: 'booking' | 'payment' | 'availability' | 'account' | 'recommendation' | 'role'; status: string }) {
  const map = { booking, payment, availability, account, recommendation, role }[kind];
  const variant = map[status] ?? 'default';
  return <Badge variant={variant}>{status.replaceAll('_', ' ')}</Badge>;
}
