import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getCurrentSession } from '../auth.service';

// Role gate for the administration panel: even if the UI is reachable, only
// users holding the Administrator role may enter. The backend enforces the
// same rule authoritatively on every /api/admin endpoint.
export function AdminRoute() {
  const location = useLocation();
  const session = getCurrentSession();
  const isAuthenticated = Boolean(session?.accessToken);
  const roles = session?.user.roles.map((role) => role.toLowerCase()) ?? [];
  const isAdmin = roles.includes('administrator');

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
