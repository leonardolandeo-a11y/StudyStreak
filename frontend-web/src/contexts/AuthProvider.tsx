import {
    useState,
    type ReactNode
} from "react";

import { AuthContext } from "./AuthContext";

import {login as loginRequest } from "../services/authService";

interface AuthProviderProps{
    children:ReactNode;
}

export function AuthProvider({children}:AuthProviderProps){
    const [isAuthenticated, setIsAuthenticated] = useState(() =>sessionStorage.getItem("accessToken") !== null);

    async function login(username: string, password: string): Promise<void>{
        const response = await loginRequest({
            username,
            password
        });
        sessionStorage.setItem("accessToken",response.token);
        sessionStorage.setItem("refreshToken", response.refreshToken);
        
        setIsAuthenticated(true);
    }
    function logout():void{
        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("refreshToken");

        setIsAuthenticated(false);
    }

    return (
        <AuthContext.Provider
            value={{isAuthenticated, login, logout}}
        >
            {children}
        </AuthContext.Provider>
    );
}