import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellRing } from 'lucide-react';
import { useDerivedNotifications } from '@/hooks/useDerivedNotifications';
import type { AppNotification } from '@/types/dashboard';
import { NOTIFICATION_META } from '@/utils/notificationMeta';
import { cn } from '@/utils/cn';

const TYPE_ICON = NOTIFICATION_META;

interface NotificationsPanelProps {
  /** Base path used for the "View all" link, e.g. "/customer". */
  base: string;
}

export default function NotificationsPanel({ base }: NotificationsPanelProps) {
  const [open, setOpen] = useState(false);
  const { items: derived } = useDerivedNotifications();
  const [items, setItems] = useState<AppNotification[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Keep the local list in sync with the derived (real-data) feed.
  useEffect(() => {
    setItems(derived);
  }, [derived]);

  const unread = items.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications (${unread} unread)`}
        className="relative rounded-xl p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span
            className="absolute right-1 top-1 flex items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-950"
            style={{ minWidth: '1.125rem', height: '1.125rem' }}
          >
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="animate-scale-in absolute right-0 z-50 mt-2 w-[min(92vw,22rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-card">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <p className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
              <BellRing className="h-4 w-4 text-brand-600 dark:text-brand-400" />
              Notifications
            </p>
            <button
              onClick={() => setItems((all) => all.map((n) => ({ ...n, read: true })))}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              Mark all read
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.map((n) => {
              const meta = TYPE_ICON[n.type];
              const Icon = meta.icon;
              return (
                <div
                  key={n.id}
                  className={cn(
                    'flex gap-3 border-b border-slate-50 px-4 py-3 transition-colors last:border-0 hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/50',
                    !n.read && 'bg-brand-50/50 dark:bg-brand-500/5',
                  )}
                >
                  <span className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', meta.color)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
                      <span className="truncate">{n.title}</span>
                      {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{n.message}</p>
                    <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">{n.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => {
              setOpen(false);
              navigate(`${base}/notifications`);
            }}
            className="block w-full border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 text-center text-xs font-bold text-brand-600 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/40 dark:text-brand-400 dark:hover:bg-slate-800"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}
