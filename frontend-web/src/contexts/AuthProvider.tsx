import {
    useState,
    type ReactNode
} from "react";

import { AuthContext } from "./AuthContext";

import {login as loginRequest } from "../services/authService";
import { getUserFromToken } from "../utils/jwt";
import type { AuthenticatedUser } from "../types/auth";
interface AuthProviderProps{
    children:ReactNode;
}

export function AuthProvider({children}:AuthProviderProps){
    const [currentUser,setCurrentUser] = useState<AuthenticatedUser|null>(() =>{
        const token = sessionStorage.getItem("accessToken");
        if (!token){
            return null;
        }
        return getUserFromToken(token);
    });

    const isAuthenticated = currentUser !== null;


    async function login(username: string, password: string): Promise<void>{
        const response = await loginRequest({
            username,
            password
        });
        const user = getUserFromToken(response.token);
        if (!user){
            throw new Error("Invalid access token");
        }
        sessionStorage.setItem("accessToken",response.token);
        sessionStorage.setItem("refreshToken", response.refreshToken);
        
        setCurrentUser(user);
    }
    function logout():void{
        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("refreshToken");
        setCurrentUser(null);
    }

    return (
        <AuthContext.Provider
            value={{isAuthenticated, currentUser, login, logout}}
        >
            {children}
        </AuthContext.Provider>
    );
}