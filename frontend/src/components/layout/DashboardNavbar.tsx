import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Wrench, Bell, LogOut, Moon, Sun, Menu, X, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeStore, applyTheme } from '@/stores/theme-store';
import { useUnreadCount } from '@/hooks/use-notifications';
import { NavItem } from '@/lib/nav';
import { cn } from '@/lib/utils';

function isActive(path: string, locationPath: string): boolean {
  // Exact path match — location.pathname already strips query strings, so
  // links like /dashboard/bookings?focus=1 still resolve to /dashboard/bookings.
  return locationPath === path;
}

export function DashboardNavbar({ items }: { items: NavItem[] }) {
  const { user, logout } = useAuthStore();
  const { dark, toggle } = useThemeStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const unread = useUnreadCount(user?.userId);

  const toggleTheme = () => {
    const next = !dark;
    toggle();
    applyTheme(next);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/85 backdrop-blur-xl dark:border-ink-800 dark:bg-ink-950/85">
      <div className="flex h-16 items-center gap-2 px-4 lg:px-8">
        {/* Brand */}
        <Link to="/" className="flex shrink-0 items-center gap-2 font-display text-xl font-bold text-ink-900 dark:text-white">
          <Wrench className="h-6 w-6 text-brand-500" />
          AutoCare
        </Link>

        {/* Desktop horizontal nav */}
        <nav className="mx-4 hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto md:flex">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path, location.pathname);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition',
                  active
                    ? 'bg-brand-500/10 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400'
                    : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-white'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <button
            onClick={toggleTheme}
            className="rounded-xl p-2 text-ink-500 transition hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
            aria-label="Toggle theme"
          >
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <Link to="/notifications" className="relative rounded-xl p-2 text-ink-500 transition hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800">
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </Link>

          {user && (
            <div className="relative">
              <button
                onClick={() => setUserOpen(!userOpen)}
                className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-ink-100 dark:hover:bg-ink-800"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-bold text-white">
                  {user.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block max-w-[120px] truncate text-sm font-semibold text-ink-900 dark:text-ink-100">{user.name}</span>
                  <span className="block text-[11px] leading-tight text-ink-400">{user.role}</span>
                </span>
                <ChevronDown className="hidden h-4 w-4 text-ink-400 sm:block" />
              </button>

              {userOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserOpen(false)} />
                  <div className="absolute right-0 top-full z-20 mt-2 w-56 animate-scale-in rounded-2xl border border-ink-100 bg-white p-2 shadow-card-lg dark:border-ink-800 dark:bg-ink-900">
                    <div className="border-b border-ink-100 px-3 py-2.5 dark:border-ink-800">
                      <p className="truncate text-sm font-bold text-ink-900 dark:text-ink-100">{user.name}</p>
                      <p className="truncate text-xs text-ink-400">{user.role.toLowerCase()}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-xl p-2 text-ink-500 transition hover:bg-ink-100 md:hidden dark:text-ink-300 dark:hover:bg-ink-800"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="max-h-[70vh] overflow-y-auto border-t border-ink-100 bg-white px-3 pb-4 pt-2 md:hidden dark:border-ink-800 dark:bg-ink-950">
          <nav className="flex flex-col gap-0.5">
            {items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path, location.pathname);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                    active
                      ? 'bg-brand-500/10 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400'
                      : 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800'
                  )}
                >
                  <Icon className="h-5 w-5" /> {item.label}
                </Link>
              );
            })}
            <Link
              to="/notifications"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
            >
              <Bell className="h-5 w-5" /> Notifications
              {unread > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[10px] font-bold text-white">{unread}</span>
              )}
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
            >
              <LogOut className="h-5 w-5" /> Sign out
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
