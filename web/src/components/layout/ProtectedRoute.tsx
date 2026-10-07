import { Navigate, Outlet } from 'react-router-dom';

import { FullPageSpinner } from '../ui/Spinner';
import { useAuth } from '../../lib/auth';

export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/auth" replace />;
  return <Outlet />;
}
