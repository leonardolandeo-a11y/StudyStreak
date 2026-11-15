import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../routes/paths';
import AppLoadingScreen from '../ui/AppLoadingScreen';

export function AuthEntry({ children }: { children?: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <AppLoadingScreen message="Restoring your study session..."/>;
  if (isAuthenticated) return <Navigate to={ROUTES.dashboard} replace/>;
  return children ?? <Navigate to={ROUTES.login} replace/>;
}
