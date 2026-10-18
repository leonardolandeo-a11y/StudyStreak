import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { ReactNode } from "react";

interface ProtectedRouteProps{
    children:ReactNode;
}

function ProtectedRoute({children}: ProtectedRouteProps){
    const {isAuthenticated} = useAuth();

    if (!isAuthenticated){
        return <Navigate to ="/login" replace/>;
    }
    return children;
}

export default ProtectedRoute;