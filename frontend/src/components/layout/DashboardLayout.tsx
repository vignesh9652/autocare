import { Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { NavItem, getNavForRole } from '@/lib/nav';
import { DashboardNavbar } from './DashboardNavbar';

export function DashboardLayout() {
  const { user } = useAuthStore();
  if (!user) return null;
  const items: NavItem[] = getNavForRole(user.role);

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
      <DashboardNavbar items={items} />
      <main className="mx-auto w-full max-w-7xl p-4 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
