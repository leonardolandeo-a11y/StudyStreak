import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { ReactNode } from "react";
import { ROUTES } from "../routes/paths";
interface ProtectedRouteProps{
    children:ReactNode;
}

function ProtectedRoute({children}: ProtectedRouteProps){
    const {isAuthenticated} = useAuth();

    if (!isAuthenticated) {
    return (
        <Navigate
            to={ROUTES.login}
            replace
        />
    );
}
    return children;
}

export default ProtectedRoute;