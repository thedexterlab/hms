import { Navigate } from 'react-router-dom';
import { getCurrentSession } from './auth.service';

export function RoleRedirect() {
  const session = getCurrentSession();

  const roles = session?.user.roles ?? [];
  const normalized = roles.map((role) => role.toLowerCase());

  if (normalized.includes('administrator')) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (normalized.includes('receptionist')) {
    return <Navigate to="/reception/dashboard" replace />;
  }

  if (normalized.includes('doctor')) {
    return <Navigate to="/doctor/dashboard" replace />;
  }

  if (normalized.includes('pharmacist')) {
    return <Navigate to="/pharmacy/dashboard" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}
