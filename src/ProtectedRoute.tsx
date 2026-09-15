import { Navigate, Outlet } from 'react-router-dom';
import { getCurrentSession } from './auth.service';

export function ProtectedRoute() {
  const session = getCurrentSession();

  if (!session?.accessToken) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
