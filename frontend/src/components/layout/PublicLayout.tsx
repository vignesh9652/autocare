import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Wrench, Moon, Sun, LogIn, UserPlus, Bell, Menu, X, LayoutDashboard, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeStore, applyTheme } from '@/stores/theme-store';
import { cn } from '@/lib/utils';
import { useUnreadCount } from '@/hooks/use-notifications';
import { Button } from '@/components/ui/Button';

export function PublicLayout() {
  const { user, logout } = useAuthStore();
  const { dark, toggle } = useThemeStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const unread = useUnreadCount(user?.userId);

  const rolePath = user?.role === 'ADMIN' ? '/admin' : user?.role === 'MECHANIC' ? '/mechanic' : '/dashboard';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleTheme = () => {
    const next = !dark;
    toggle();
    applyTheme(next);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/80 backdrop-blur-xl dark:border-ink-800 dark:bg-ink-950/80">
        <div className="container-app flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-ink-900 dark:text-white">
            <Wrench className="h-6 w-6 text-brand-500" />
            AutoCare
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/mechanics" className={({ isActive }) => cn('rounded-xl px-3 py-2 text-sm font-medium transition', isActive ? 'text-brand-600 dark:text-brand-400' : 'text-ink-600 hover:text-ink-900 dark:text-ink-300 dark:hover:text-white')}>
              Mechanics
            </NavLink>
            <NavLink to="/parts" className={({ isActive }) => cn('rounded-xl px-3 py-2 text-sm font-medium transition', isActive ? 'text-brand-600 dark:text-brand-400' : 'text-ink-600 hover:text-ink-900 dark:text-ink-300 dark:hover:text-white')}>
              Spare Parts
            </NavLink>
            {user && (
              <NavLink to={rolePath} className={({ isActive }) => cn('rounded-xl px-3 py-2 text-sm font-medium transition', isActive ? 'text-brand-600 dark:text-brand-400' : 'text-ink-600 hover:text-ink-900 dark:text-ink-300 dark:hover:text-white')}>
                Dashboard
              </NavLink>
            )}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="rounded-xl p-2 text-ink-500 transition hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
              aria-label="Toggle theme"
            >
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {user ? (
              <>
                <Link to="/notifications" className="relative rounded-xl p-2 text-ink-500 transition hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800">
                  <Bell className="h-5 w-5" />
                  {unread > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </Link>
                <div className="hidden items-center gap-2 md:flex">
                  <Link to={rolePath} className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-ink-100 dark:hover:bg-ink-800">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-bold text-white">
                      {user.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                    </span>
                    <span className="hidden text-sm font-medium text-ink-700 dark:text-ink-200 lg:block">{user.name.split(' ')[0]}</span>
                  </Link>
                  <button onClick={handleLogout} className="rounded-xl p-2 text-ink-400 transition hover:bg-ink-100 hover:text-red-600 dark:hover:bg-ink-800" aria-label="Sign out">
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="hidden items-center gap-2 md:flex">
                <Link to="/login">
                  <Button variant="ghost" size="sm"><LogIn className="h-4 w-4" /> Sign In</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm"><UserPlus className="h-4 w-4" /> Get Started</Button>
                </Link>
              </div>
            )}

            <button onClick={() => setMobileOpen(!mobileOpen)} className="rounded-xl p-2 text-ink-500 hover:bg-ink-100 md:hidden dark:text-ink-300 dark:hover:bg-ink-800">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-ink-100 bg-white px-4 pb-4 pt-2 md:hidden dark:border-ink-800 dark:bg-ink-950">
            <div className="flex flex-col gap-1">
              <Link to="/mechanics" className="rounded-xl px-3 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50 dark:text-ink-300">Mechanics</Link>
              <Link to="/parts" className="rounded-xl px-3 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50 dark:text-ink-300">Spare Parts</Link>
              {user ? (
                <>
                  <Link to={rolePath} className="rounded-xl px-3 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50 dark:text-ink-300"><LayoutDashboard className="mr-1 inline h-4 w-4" /> Dashboard</Link>
                  <button onClick={handleLogout} className="rounded-xl px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50">Sign Out</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="rounded-xl px-3 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50 dark:text-ink-300">Sign In</Link>
                  <Link to="/register" className="rounded-xl px-3 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50">Get Started</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-ink-100 bg-white py-10 dark:border-ink-800 dark:bg-ink-950">
        <div className="container-app">
          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <div className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-ink-900 dark:text-white">
                <Wrench className="h-5 w-5 text-brand-500" /> AutoCare
              </div>
              <p className="text-sm text-ink-500 dark:text-ink-400">Doorstep vehicle repair & spare parts, done right.</p>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-ink-900 dark:text-ink-100">Services</h4>
              <ul className="space-y-2 text-sm text-ink-500 dark:text-ink-400">
                <li>Oil Change · Brakes · Engine</li>
                <li>AC Repair · Tyres · Battery</li>
                <li>Doorstep pickup & drop</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-ink-900 dark:text-ink-100">Contact</h4>
              <ul className="space-y-2 text-sm text-ink-500 dark:text-ink-400">
                <li>support@autocare.com</li>
                <li>1-800-AUTOCARE</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-ink-100 pt-6 text-center text-xs text-ink-400 dark:border-ink-800">
            © {new Date().getFullYear()} AutoCare. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
