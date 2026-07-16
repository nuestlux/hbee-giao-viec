import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';

interface RequireAuthProps {
  children: React.ReactNode;
}

/** Redirects unauthenticated users to /login, preserving return path. */
export default function RequireAuth({ children }: RequireAuthProps) {
  const currentUser = useStore((s) => s.currentUser);
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return <>{children}</>;
}
