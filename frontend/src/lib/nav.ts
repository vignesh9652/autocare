import {
  LayoutDashboard, Car, MapPin, CalendarCheck, CreditCard, Star, ShoppingBag,
  ClipboardList, Clock, Package, UserCheck, Wrench, Users, DollarSign, Bell, Tags, Wallet,
  BookOpen, Wrench as WrenchIcon,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export const customerNav: NavItem[] = [
  { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
  { label: 'My Vehicles', path: '/dashboard/vehicles', icon: Car },
  { label: 'Book Service', path: '/dashboard/book-service', icon: MapPin },
  { label: 'My Bookings', path: '/dashboard/bookings', icon: CalendarCheck },
  { label: 'My Installations', path: '/dashboard/installations', icon: WrenchIcon },
  { label: 'Payments', path: '/dashboard/payments', icon: CreditCard },
  { label: 'Reviews', path: '/dashboard/reviews', icon: Star },
  { label: 'Marketplace', path: '/dashboard/marketplace', icon: ShoppingBag },
];

export const mechanicNav: NavItem[] = [
  { label: 'Overview', path: '/mechanic', icon: LayoutDashboard },
  { label: 'Assigned Jobs', path: '/mechanic/jobs', icon: ClipboardList },
  { label: 'Installation Requests', path: '/mechanic/jobs?type=installations', icon: WrenchIcon },
  { label: 'Availability', path: '/mechanic/availability', icon: Clock },
  { label: 'Recommendations', path: '/mechanic/recommendations', icon: Package },
  { label: 'Wallet', path: '/mechanic/wallet', icon: Wallet },
  { label: 'Profile', path: '/mechanic/profile', icon: UserCheck },
];

export const adminNav: NavItem[] = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { label: 'Bookings', path: '/admin/bookings', icon: CalendarCheck },
  { label: 'Installations', path: '/admin/installations', icon: WrenchIcon },
  { label: 'DIY Guides', path: '/admin/diy', icon: BookOpen },
  { label: 'Mechanics', path: '/admin/mechanics', icon: Wrench },
  { label: 'Customers', path: '/admin/customers', icon: Users },
  { label: 'Payments', path: '/admin/payments', icon: DollarSign },
  { label: 'Wallet', path: '/admin/wallet', icon: Wallet },
  { label: 'Services & Pricing', path: '/admin/services', icon: Tags },
  { label: 'Approvals', path: '/admin/approvals', icon: UserCheck },
];

export function getNavForRole(role: string): NavItem[] {
  if (role === 'ADMIN') return adminNav;
  if (role === 'MECHANIC') return mechanicNav;
  return customerNav;
}

export { Bell };
