import { useEffect, useState, type ReactNode } from "react";
import axios from "axios";
import { AuthContext } from "./AuthContext";
import { login as loginRequest } from "../services/authService";
import { getUserFromToken } from "../utils/jwt";
import type { AuthenticatedUser, LoginResponse } from "../types/auth";

interface AuthProviderProps {
    children: ReactNode;
}

function storedUser(): AuthenticatedUser | null {
    const token = sessionStorage.getItem("accessToken");
    return token ? getUserFromToken(token) : null;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(storedUser);
    const [isLoading, setIsLoading] = useState(() => !storedUser() && Boolean(sessionStorage.getItem("refreshToken")));

    useEffect(() => {
        if (!isLoading) return;
        const expectedRefresh = sessionStorage.getItem("refreshToken");
        if (!expectedRefresh) { void Promise.resolve().then(() => setIsLoading(false)); return; }
        let active = true;

        void axios.post<LoginResponse>(`${import.meta.env.VITE_API_BASE_URL}/refresh`,
            { refreshToken: expectedRefresh }, { timeout: 15000 })
            .then(({ data }) => {
                if (!active || sessionStorage.getItem("refreshToken") !== expectedRefresh) return;
                const user = getUserFromToken(data.token);
                if (!user) throw new Error("Invalid access token returned by the server.");
                sessionStorage.setItem("accessToken", data.token);
                sessionStorage.setItem("refreshToken", data.refreshToken);
                setCurrentUser(user);
            })
            .catch((error: unknown) => {
                if (!active || sessionStorage.getItem("refreshToken") !== expectedRefresh) return;
                if (axios.isAxiosError(error) && [400, 401, 403].includes(error.response?.status ?? 0)) {
                    sessionStorage.removeItem("accessToken");
                    sessionStorage.removeItem("refreshToken");
                }
            })
            .finally(() => { if (active) setIsLoading(false); });
        return () => { active = false; };
    }, [isLoading]);

    async function login(username: string, password: string): Promise<void> {
        const response = await loginRequest({ username, password });
        const user = getUserFromToken(response.token);
        if (!user) throw new Error("Invalid access token");
        sessionStorage.setItem("accessToken", response.token);
        sessionStorage.setItem("refreshToken", response.refreshToken);
        setCurrentUser(user);
        setIsLoading(false);
    }

    function logout(): void {
        const refreshToken = sessionStorage.getItem("refreshToken");
        if (refreshToken) {
            // A failed revocation request must not prevent local sign-out.
            void axios.post(`${import.meta.env.VITE_API_BASE_URL}/logout`,
                { refreshToken }, { timeout: 3500 }).catch(() => undefined);
        }
        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("refreshToken");
        setCurrentUser(null);
        setIsLoading(false);
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated: currentUser !== null, isLoading, currentUser, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
