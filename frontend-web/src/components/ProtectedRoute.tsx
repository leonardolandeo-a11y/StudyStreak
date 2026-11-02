import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { ReactNode } from "react";
import { ROUTES } from "../routes/paths";
import LoadingState from "./ui/LoadingState";

interface ProtectedRouteProps {
    children: ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) return <LoadingState message="Restoring session..." />;
    if (!isAuthenticated) return <Navigate to={ROUTES.login} replace />;
    return children;
}

export default ProtectedRoute;
