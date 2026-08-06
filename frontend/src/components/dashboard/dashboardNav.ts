import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  Car,
  ClipboardList,
  Clock4,
  CreditCard,
  FileBarChart2,
  Hammer,
  History,
  LayoutDashboard,
  MessageSquare,
  Package,
  PackageSearch,
  ScrollText,
  Settings,
  ShoppingBag,
  Star,
  TrendingUp,
  User,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react';

export interface NavItem {
  label: string;
  /** Route relative to the dashboard base (e.g. "vehicles"). Empty = index. */
  to: string;
  icon: LucideIcon;
  badge?: number;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const CUSTOMER_NAV: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', to: '', icon: LayoutDashboard },
      { label: 'My Vehicles', to: 'vehicles', icon: Car },
      { label: 'Book Service', to: 'book-service', icon: CalendarPlus },
    ],
  },
  {
    title: 'Bookings',
    items: [
      { label: 'My Bookings', to: 'bookings', icon: CalendarDays },
      { label: 'Booking History', to: 'history', icon: History },
    ],
  },
  {
    title: 'Shop',
    items: [
      { label: 'Spare Parts', to: 'parts', icon: ShoppingBag },
      { label: 'My Orders', to: 'orders', icon: Package },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Notifications', to: 'notifications', icon: Bell, badge: 3 },
      { label: 'Payments', to: 'payments', icon: CreditCard },
      { label: 'Reviews & Ratings', to: 'reviews', icon: Star },
      { label: 'Profile', to: 'profile', icon: User },
      { label: 'Settings', to: 'settings', icon: Settings },
    ],
  },
];

export const MECHANIC_NAV: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', to: '', icon: LayoutDashboard },
      { label: 'Assigned Jobs', to: 'jobs', icon: ClipboardList },
      { label: 'Active Repairs', to: 'repairs', icon: Hammer },
      { label: 'Completed Jobs', to: 'completed', icon: CalendarCheck },
    ],
  },
  {
    title: 'Workflow',
    items: [
      { label: 'Installation Jobs', to: 'installation-jobs', icon: Wrench },
      { label: 'Part Recommendations', to: 'recommendations', icon: PackageSearch },
      { label: 'Customer Messages', to: 'messages', icon: MessageSquare, badge: 3 },
    ],
  },
  {
    title: 'Insights',
    items: [
      { label: 'Availability', to: 'availability', icon: Clock4 },
      { label: 'Earnings', to: 'earnings', icon: Wallet },
      { label: 'Performance', to: 'performance', icon: TrendingUp },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Notifications', to: 'notifications', icon: Bell, badge: 2 },
      { label: 'Profile', to: 'profile', icon: User },
    ],
  },
];

export const ADMIN_NAV: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', to: '', icon: LayoutDashboard },
      { label: 'Customers', to: 'customers', icon: Users },
      { label: 'Mechanics', to: 'mechanics', icon: Wrench },
      { label: 'Vehicles', to: 'vehicles', icon: Car },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Bookings', to: 'bookings', icon: CalendarDays },
      { label: 'Spare Parts', to: 'parts', icon: PackageSearch },
      { label: 'Payments', to: 'payments', icon: CreditCard },
      { label: 'Reports', to: 'reports', icon: FileBarChart2 },
    ],
  },
  {
    title: 'Platform',
    items: [
      { label: 'Notifications', to: 'notifications', icon: Bell },
      { label: 'System Settings', to: 'settings', icon: Settings },
      { label: 'Audit Logs', to: 'audit-logs', icon: ScrollText },
      { label: 'Profile', to: 'profile', icon: User },
    ],
  },
];

/** Flattened label lookup used for breadcrumbs. */
export function navLabels(nav: NavSection[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const section of nav) {
    for (const item of section.items) {
      map[item.to] = item.label;
    }
  }
  return map;
}
