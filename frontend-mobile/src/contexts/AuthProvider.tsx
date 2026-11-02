import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import { authService } from '../services/authService';
import { subscribeToSessionExpiration } from '../services/authSession';
import type { AuthenticatedUser, RegisterRequest } from '../types/auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionRestoreError, setSessionRestoreError] = useState(false);
  const restoreAttempt = useRef(0);

  const restoreSession = useCallback(async (attempt: number) => {
    try {
      const user = await authService.restoreSession();
      if (attempt === restoreAttempt.current) setCurrentUser(user);
    } catch {
      if (attempt === restoreAttempt.current) {
        setCurrentUser(null);
        setSessionRestoreError(true);
      }
    } finally {
      if (attempt === restoreAttempt.current) setIsLoading(false);
    }
  }, []);

  const retrySession = useCallback(async () => {
    const attempt = ++restoreAttempt.current;
    setIsLoading(true);
    setSessionRestoreError(false);
    await restoreSession(attempt);
  }, [restoreSession]);

  useEffect(() => {
    const unsubscribe = subscribeToSessionExpiration(() => {
      restoreAttempt.current += 1;
      setCurrentUser(null);
      setSessionRestoreError(false);
      setIsLoading(false);
    });
    const attempt = ++restoreAttempt.current;
    void restoreSession(attempt);
    return () => { unsubscribe(); restoreAttempt.current += 1; };
  }, [restoreSession]);

  const value = useMemo(() => ({
    currentUser,
    isAuthenticated: currentUser !== null,
    isLoading,
    sessionRestoreError,
    retrySession,
    async signIn(username: string, password: string) {
      restoreAttempt.current += 1;
      const user = await authService.login({ username, password });
      setCurrentUser(user);
      setSessionRestoreError(false);
      setIsLoading(false);
    },
    async signUp(request: RegisterRequest) {
      return authService.register(request);
    },
    async signOut() {
      restoreAttempt.current += 1;
      setCurrentUser(null);
      setSessionRestoreError(false);
      setIsLoading(false);
      await authService.logout();
    },
  }), [currentUser, isLoading, sessionRestoreError, retrySession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
