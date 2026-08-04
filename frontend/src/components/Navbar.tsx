import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const FEATURE_LINKS = [
  { to: '/vehicles', label: 'Vehicles' },
  { to: '/mechanics', label: 'Mechanics' },
  { to: '/bookings', label: 'Bookings' },
  { to: '/spare-parts', label: 'Spare Parts' },
  { to: '/payments', label: 'Payments' },
  { to: '/reviews', label: 'Reviews' },
];

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
      isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
      <nav className="container-page flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
          <span aria-hidden>🚗</span>
          Auto<span className="text-accent-400">Care</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {isAuthenticated ? (
            <>
              {FEATURE_LINKS.map((l) => (
                <NavLink key={l.to} to={l.to} className={navLinkClass} end={l.to === '/vehicles'}>
                  {l.label}
                </NavLink>
              ))}
              {user?.role === 'ADMIN' && (
                <NavLink to="/admin" className={navLinkClass}>
                  Admin
                </NavLink>
              )}
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:text-white">
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
              >
                Sign Up
              </Link>
            </>
          )}
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="ml-2 rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:border-red-500/50 hover:text-red-400"
            >
              Logout
            </button>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 md:hidden"
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
        <div className="border-t border-slate-800 bg-slate-950 px-4 py-3 md:hidden">
          {isAuthenticated ? (
            <>
              {FEATURE_LINKS.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
                >
                  {l.label}
                </Link>
              ))}
              {user?.role === 'ADMIN' && (
                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={() => {
                  setMobileOpen(false);
                  handleLogout();
                }}
                className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-400 hover:bg-slate-800"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="flex gap-3">
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="flex-1 rounded-lg bg-slate-800 px-4 py-2 text-center text-sm font-semibold text-white"
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
