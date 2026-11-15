import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { ReactNode } from "react";
import { ROUTES } from "../routes/paths";
import AppLoadingScreen from "./ui/AppLoadingScreen";

interface ProtectedRouteProps {
    children: ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) return <AppLoadingScreen message="Restoring your study session..." />;
    if (!isAuthenticated) return <Navigate to={ROUTES.login} replace />;
    return children;
}

export default ProtectedRoute;
