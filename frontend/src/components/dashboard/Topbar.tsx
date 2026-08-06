import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, LogOut, Menu, Moon, Search, Settings, Sun, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Avatar from '@/components/ui/Avatar';
import Dropdown from '@/components/ui/Dropdown';
import NotificationsPanel from './NotificationsPanel';
import { navLabels, type NavSection } from './dashboardNav';

interface TopbarProps {
  base: string;
  nav: NavSection[];
  onMenuClick: () => void;
  searchPlaceholder?: string;
}

export default function Topbar({ base, nav, onMenuClick, searchPlaceholder = 'Search…' }: TopbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const labels = navLabels(nav);
  const hasSettings = Boolean(labels['settings']);
  const rest = location.pathname.replace(base, '').split('/').filter(Boolean);
  const crumbs = [
    { label: 'Dashboard', to: base },
    ...rest.map((seg) => ({ label: labels[seg] ?? seg, to: `${base}/${seg}` })),
  ];

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <header className="glass sticky top-0 z-40 flex h-16 items-center gap-3 px-4 sm:px-6">
      <button
        onClick={onMenuClick}
        aria-label="Open menu"
        className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="hidden items-center gap-1.5 text-sm min-w-0 md:flex">
        {crumbs.map((crumb, i) => (
          <span key={crumb.to} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300 dark:text-slate-600" />}
            {i === crumbs.length - 1 ? (
              <span className="truncate font-semibold text-slate-800 dark:text-slate-100">{crumb.label}</span>
            ) : (
              <Link
                to={crumb.to}
                className="truncate text-slate-400 transition-colors hover:text-brand-600 dark:text-slate-500 dark:hover:text-brand-400"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>
      <span className="truncate text-sm font-semibold text-slate-800 md:hidden dark:text-slate-100">
        {crumbs[crumbs.length - 1]?.label}
      </span>

      <div className="flex-1" />

      {/* Search */}
      <div className="relative hidden lg:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder={searchPlaceholder}
          className="input w-56 py-2 pl-9 xl:w-72 [&::-webkit-search-cancel-button]:hidden"
        />
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        className="rounded-xl p-2.5 text-slate-500 transition-all hover:bg-slate-100 hover:text-amber-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-amber-300"
      >
        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      {/* Notifications */}
      <NotificationsPanel base={base} />

      {/* Profile menu */}
      <Dropdown
        align="right"
        width="w-60"
        trigger={
          <button className="flex items-center gap-2.5 rounded-xl p-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
            <Avatar name={user?.email ?? 'AutoCare User'} size="sm" />
            <span className="hidden max-w-28 truncate text-sm font-semibold text-slate-700 xl:block dark:text-slate-200">
              {user?.email?.split('@')[0] ?? 'User'}
            </span>
          </button>
        }
        items={[
          { label: 'My Profile', icon: <User className="h-4 w-4" />, onClick: () => navigate(`${base}/profile`) },
          ...(hasSettings
            ? [{ label: 'Settings', icon: <Settings className="h-4 w-4" />, onClick: () => navigate(`${base}/settings`) }]
            : []),
          { label: 'Logout', icon: <LogOut className="h-4 w-4" />, danger: true, divider: true, onClick: handleLogout },
        ]}
      />
    </header>
  );
}
