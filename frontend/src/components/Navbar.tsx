import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

/** The dashboard path matching the user's role. */
export function dashboardPathFor(role?: string): string {
  if (role === 'ADMIN') return '/admin';
  if (role === 'MECHANIC') return '/mechanic';
  return '/customer';
}

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-brand-50 text-brand-700 dark:bg-slate-800 dark:text-white'
        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
    }`;

  return (
    <header className="glass sticky top-0 z-40">
      <nav className="container-page flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-sky-500 text-white shadow-md shadow-brand-600/25">
            <svg style={{ height: '1.125rem', width: '1.125rem' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
              <circle cx="7" cy="17" r="2" />
              <path d="M9 17h6" />
              <circle cx="17" cy="17" r="2" />
            </svg>
          </span>
          <span className="text-slate-900 dark:text-white">
            Auto<span className="text-brand-600 dark:text-brand-400">Care</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {isAuthenticated ? (
            <>
              <NavLink to={dashboardPathFor(user?.role)} className={navLinkClass}>
                <span className="inline-flex items-center gap-1.5">
                  <LayoutDashboard className="h-4 w-4" /> My Dashboard
                </span>
              </NavLink>
              {user?.role === 'ADMIN' && (
                <NavLink to="/admin" className={navLinkClass}>
                  Admin
                </NavLink>
              )}
              <button
                onClick={handleLogout}
                className="ml-2 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:border-red-300 hover:text-red-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-red-500/50 dark:hover:text-red-400"
              >
                <LogOut className="h-3.5 w-3.5" /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition-all hover:from-brand-700 hover:to-brand-600 hover:-translate-y-0.5"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800 md:hidden">
          {isAuthenticated ? (
            <>
              <Link
                to={dashboardPathFor(user?.role)}
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                My Dashboard
              </Link>
              {user?.role === 'ADMIN' && (
                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={() => {
                  setMobileOpen(false);
                  handleLogout();
                }}
                className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-slate-800"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="flex gap-3">
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="flex-1 rounded-lg bg-slate-100 px-4 py-2 text-center text-sm font-semibold text-slate-800 dark:bg-slate-800 dark:text-white"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="flex-1 rounded-lg bg-brand-600 px-4 py-2 text-center text-sm font-semibold text-white"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
