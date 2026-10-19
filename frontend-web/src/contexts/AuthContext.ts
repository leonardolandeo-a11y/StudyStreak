import { createContext } from "react";
import type { AuthenticatedUser } from "../types/auth";
export interface AuthContextType{
    isAuthenticated :boolean;
    currentUser: AuthenticatedUser | null;
    login: (username : string, password :string) => Promise<void>;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined> (undefined);
