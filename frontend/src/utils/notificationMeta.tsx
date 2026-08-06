import {
  AlarmClock,
  CalendarCheck,
  CreditCard,
  MessageSquare,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import type { AppNotification } from '@/types/dashboard';

export interface NotificationMeta {
  icon: LucideIcon;
  color: string;
  label: string;
}

export const NOTIFICATION_META: Record<AppNotification['type'], NotificationMeta> = {
  booking: {
    icon: CalendarCheck,
    label: 'Booking',
    color: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
  },
  payment: {
    icon: CreditCard,
    label: 'Payment',
    color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  },
  message: {
    icon: MessageSquare,
    label: 'Message',
    color: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400',
  },
  reminder: {
    icon: AlarmClock,
    label: 'Reminder',
    color: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  },
  system: {
    icon: Settings,
    label: 'System',
    color: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400',
  },
  approval: {
    icon: ShieldCheck,
    label: 'Approval',
    color: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400',
  },
};
