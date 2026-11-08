import axios, { isAxiosError } from 'axios';
import { apiClient } from './apiClient';
import { tokenStorage } from './tokenStorage';
import { assertSessionRevision, beginSessionChange, getSessionRevision, isSessionRejection } from './authSession';
import { refreshSession } from './sessionRefresh';
import { requireConfiguredApiBaseUrl } from '../config/apiRuntime';
import { getUserFromToken } from '../utils/jwt';
import type {
  AuthenticatedUser,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from '../types/auth';

let restoreTask: { revision: number; task: Promise<AuthenticatedUser | null> } | null = null;

async function restoreActiveSession(revision: number): Promise<AuthenticatedUser | null> {
  requireConfiguredApiBaseUrl();
  const accessToken = await tokenStorage.getAccessToken();
  assertSessionRevision(revision);
  const user = accessToken ? getUserFromToken(accessToken) : null;
  if (user) return user;

  const refreshToken = await tokenStorage.getRefreshToken();
  assertSessionRevision(revision);
  if (!refreshToken) return null;

  try {
    const data = await refreshSession(revision);
    assertSessionRevision(revision);
    return getUserFromToken(data.token);
  } catch (error) {
    if (isAxiosError(error) && isSessionRejection(error.response?.status)) {
      return null;
    }
    // Preserve tokens on network failures so the user can retry session recovery.
    throw error;
  }
}

export const authService = {
  async login(request: LoginRequest): Promise<AuthenticatedUser> {
    requireConfiguredApiBaseUrl();
    const revision = beginSessionChange();
    const { data } = await apiClient.post<LoginResponse>('/login', request);
    assertSessionRevision(revision);
    const user = getUserFromToken(data.token);
    if (!user || typeof data.refreshToken !== 'string' || !data.refreshToken) {
      throw new Error('Invalid credentials returned by the server.');
    }
    // Requests started while login was in flight still used the previous
    // credentials. Invalidate those before making the new account active.
    const activeRevision = beginSessionChange();
    await tokenStorage.setTokens(data, activeRevision);
    return user;
  },

  async register(request: RegisterRequest): Promise<RegisterResponse> {
    const { data } = await apiClient.post<RegisterResponse>('/register', request);
    return data;
  },

  restoreSession(): Promise<AuthenticatedUser | null> {
    const revision = getSessionRevision();
    if (restoreTask?.revision !== revision) {
      const task = restoreActiveSession(revision).finally(() => {
        if (restoreTask?.task === task) restoreTask = null;
      });
      restoreTask = { revision, task };
    }
    return restoreTask.task;
  },

  async logout(): Promise<void> {
    const previousRefreshToken = tokenStorage.getRefreshToken();
    // Clear local credentials before the network call to prevent refresh during logout.
    await tokenStorage.clear();
    const refreshToken = await previousRefreshToken;
    if (!refreshToken) return;
    try {
      await axios.post('/logout', { refreshToken }, {
        baseURL: requireConfiguredApiBaseUrl(),
        timeout: 3500,
      });
    } catch {
      // A network failure must not prevent local sign-out.
    }
  },
};
