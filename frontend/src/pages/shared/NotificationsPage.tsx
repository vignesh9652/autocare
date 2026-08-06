import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/Button';
import Tabs from '@/components/ui/Tabs';
import EmptyState from '@/components/ui/EmptyState';
import { NOTIFICATION_META } from '@/utils/notificationMeta';
import { useDerivedNotifications } from '@/hooks/useDerivedNotifications';
import type { AppNotification, NotificationType } from '@/types/dashboard';
import { cn } from '@/utils/cn';

type Filter = 'ALL' | NotificationType;

export default function NotificationsPage() {
  const { items: derived } = useDerivedNotifications();
  const [filter, setFilter] = useState<Filter>('ALL');
  const [items, setItems] = useState<AppNotification[]>([]);

  useEffect(() => {
    setItems(derived);
  }, [derived]);

  const unread = items.filter((n) => !n.read).length;
  const rows = useMemo(
    () => (filter === 'ALL' ? items : items.filter((n) => n.type === filter)),
    [items, filter],
  );

  const count = (key: Filter) =>
    key === 'ALL' ? items.length : items.filter((n) => n.type === key).length;

  const toggleRead = (id: number) =>
    setItems((all) => all.map((n) => (n.id === id ? { ...n, read: true } : n)));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Notifications"
        subtitle={`${unread} unread · stay on top of bookings, payments and reminders`}
        icon={<Bell className="h-5 w-5" />}
        actions={
          <Button variant="secondary" size="sm" onClick={() => setItems((all) => all.map((n) => ({ ...n, read: true })))}>
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        }
      />

      <div className="mb-4">
        <Tabs
          variant="pill"
          items={[
            { key: 'ALL', label: 'All', count: count('ALL') },
            { key: 'booking', label: 'Bookings', count: count('booking') },
            { key: 'payment', label: 'Payments', count: count('payment') },
            { key: 'message', label: 'Messages', count: count('message') },
            { key: 'reminder', label: 'Reminders', count: count('reminder') },
          ]}
          active={filter}
          onChange={(k) => setFilter(k as Filter)}
        />
      </div>

      {rows.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Bell className="h-9 w-9" />}
            title="No notifications"
            description="You're all caught up! New updates will appear here."
          />
        </div>
      ) : (
        <div className="card divide-y divide-slate-100 overflow-hidden dark:divide-slate-800">
          {rows.map((n) => {
            const meta = NOTIFICATION_META[n.type];
            const Icon = meta.icon;
            return (
              <button
                key={n.id}
                onClick={() => toggleRead(n.id)}
                className={cn(
                  'flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50',
                  !n.read && 'bg-brand-50/60 dark:bg-brand-500/5',
                )}
              >
                <span className={cn('mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', meta.color)}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{n.title}</span>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-brand-500" />}
                  </span>
                  <span className="mt-0.5 block text-sm text-slate-500 dark:text-slate-400">{n.message}</span>
                  <span className="mt-1.5 flex items-center gap-2">
                    <Badge variant="neutral">{meta.label}</Badge>
                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">{n.time}</span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
