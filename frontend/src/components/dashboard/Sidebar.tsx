import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Car, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/utils/cn';
import type { NavSection } from './dashboardNav';

interface SidebarProps {
  nav: NavSection[];
  base: string;
  onNavigate?: () => void;
}

export default function Sidebar({ nav, base, onNavigate }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="flex h-full w-full flex-col border-r border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-slate-100 px-5 dark:border-slate-800">
        <Link to={base} onClick={onNavigate} className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-sky-500 text-white shadow-md shadow-brand-600/30">
            <Car className="h-5 w-5" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
            Auto<span className="text-brand-600 dark:text-brand-400">Care</span>
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Dashboard navigation">
        {nav.map((section) => (
          <div key={section.title} className="mb-5">
            <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const to = item.to === '' ? base : `${base}/${item.to}`;
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={to}
                      end={item.to === ''}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                          isActive
                            ? 'bg-gradient-to-r from-brand-50 to-sky-50 text-brand-700 shadow-sm ring-1 ring-brand-200/60 dark:from-brand-500/15 dark:to-sky-500/10 dark:text-brand-300 dark:ring-brand-500/25'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            className={cn(
                              'h-[18px] w-[18px] shrink-0 transition-transform duration-150 group-hover:scale-110',
                              isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500',
                            )}
                          />
                          <span className="flex-1 truncate">{item.label}</span>
                          {typeof item.badge === 'number' && item.badge > 0 && (
                            <span className="rounded-full bg-gradient-to-r from-brand-600 to-sky-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                              {item.badge}
                            </span>
                          )}
                          {isActive && (
                            <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-brand-600 to-sky-500" />
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User + logout */}
      <div className="shrink-0 border-t border-slate-100 p-3 dark:border-slate-800">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-sky-500 text-sm font-bold text-white">
            {user?.email?.[0]?.toUpperCase() ?? 'A'}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
              {user?.email ?? 'User'}
            </p>
            <p className="truncate text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
              {user?.role ?? ''}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </div>
  );
}
