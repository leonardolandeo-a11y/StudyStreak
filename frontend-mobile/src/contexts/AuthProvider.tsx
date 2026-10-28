import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import { authService } from '../services/authService';
import type { AuthenticatedUser, RegisterRequest } from '../types/auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    authService.restoreSession()
      .then((user) => { if (active) setCurrentUser(user); })
      .catch(() => { if (active) setCurrentUser(null); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  const value = useMemo(() => ({
    currentUser,
    isAuthenticated: currentUser !== null,
    isLoading,
    async signIn(username: string, password: string) {
      const user = await authService.login({ username, password });
      setCurrentUser(user);
    },
    async signUp(request: RegisterRequest) {
      return authService.register(request);
    },
    async signOut() {
      await authService.logout();
      setCurrentUser(null);
    },
  }), [currentUser, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
