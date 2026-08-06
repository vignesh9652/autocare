import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/** Post-login landing: redirects to the dashboard matching the user's role. */
export default function RoleRedirect() {
  const { user } = useAuth();
  const path =
    user?.role === 'ADMIN' ? '/admin' : user?.role === 'MECHANIC' ? '/mechanic' : '/customer';
  return <Navigate to={path} replace />;
}
