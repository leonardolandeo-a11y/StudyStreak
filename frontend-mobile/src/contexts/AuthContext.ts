import { createContext } from 'react';
import type { AuthenticatedUser, RegisterRequest, RegisterResponse } from '../types/auth';

export interface AuthContextValue {
  currentUser: AuthenticatedUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn(username: string, password: string): Promise<void>;
  signUp(request: RegisterRequest): Promise<RegisterResponse>;
  signOut(): Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
