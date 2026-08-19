import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { LoadingScreen } from '@/components/ui/Feedback';

export function ProtectedRoute({ roles }: { roles?: string[] }) {
  const { user } = useAuthStore();
  const location = useLocation();

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) {
    const home = user.role === 'ADMIN' ? '/admin' : user.role === 'MECHANIC' ? '/mechanic' : '/dashboard';
    return <Navigate to={home} replace />;
  }

  return <Outlet />;
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  if (!user) return <LoadingScreen label="Checking session…" />;
  return <>{children}</>;
}
