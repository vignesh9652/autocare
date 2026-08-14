import { motion } from 'framer-motion';
import { Bell, CheckCheck, Info, AlertTriangle, Wrench, type LucideIcon } from 'lucide-react';
import { useNotifications, useMarkAllRead, useMarkRead } from '@/hooks/use-notifications';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/Button';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/ui/Feedback';
import { cn, timeAgo } from '@/lib/utils';

const ICONS: Record<string, LucideIcon> = {
  BOOKING: Info,
  PAYMENT: Info,
  REVIEW: Info,
  ACCOUNT: AlertTriangle,
  SYSTEM: Info,
  ADDITIONAL_SERVICE: Wrench,
};

export function NotificationsScreen() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, refetch } = useNotifications(user?.userId);
  const markAll = useMarkAllRead(user?.userId);
  const markRead = useMarkRead(user?.userId);

  if (isLoading) return <CardSkeleton count={4} />;
  if (isError) return <ErrorState message="Could not load notifications" onRetry={() => refetch()} />;

  const items = data ?? [];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900 dark:text-ink-100">Notifications</h1>
          <p className="mt-1 text-sm text-ink-500">Updates about your bookings, payments and account.</p>
        </div>
        {items.some((n) => !n.read) && (
          <Button variant="outline" size="sm" onClick={() => markAll.mutate()} loading={markAll.isPending}>
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState icon={<Bell className="h-6 w-6" />} title="No notifications" description="You're all caught up. New updates will appear here." />
      ) : (
        <div className="space-y-2.5">
          {items.map((n) => {
            const Icon = ICONS[n.type] ?? Info;
            return (
              <motion.button
                key={n.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => { if (!n.read) markRead.mutate(n.id); }}
                className={cn(
                  'card flex w-full items-start gap-3 p-4 text-left transition',
                  !n.read && 'border-brand-300 bg-brand-50/50 dark:border-brand-500/40 dark:bg-brand-500/5'
                )}
              >
                <div className={cn('mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl', n.read ? 'bg-ink-100 text-ink-400 dark:bg-ink-800' : 'bg-brand-500/15 text-brand-600 dark:text-brand-400')}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn('text-sm font-semibold text-ink-900 dark:text-ink-100', !n.read && 'font-bold')}>{n.title}</p>
                    <span className="shrink-0 text-xs text-ink-400">{timeAgo(n.createdAt)}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">{n.message}</p>
                </div>
                {!n.read && <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500" />}
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
