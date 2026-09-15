import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getCurrentSession } from '../auth.service';

export function ProtectedRoute() {
  const location = useLocation();
  const session = getCurrentSession();
  const isAuthenticated = Boolean(session?.accessToken);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
