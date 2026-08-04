import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { Role } from '@/types';

interface ProtectedRouteProps {
  children: ReactNode;
  /** If provided, the user must have exactly this role (e.g. "ADMIN"). */
  requiredRole?: Role;
}

/**
 * Guards a route:
 * - Redirects to /login when there is no valid token.
 * - Redirects to /unauthorized when the user's role does not match requiredRole.
 */
export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
