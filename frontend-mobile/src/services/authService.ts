import axios, { isAxiosError } from 'axios';
import { apiClient } from './apiClient';
import { tokenStorage } from './tokenStorage';
import { isSessionRejection } from './authSession';
import { getUserFromToken } from '../utils/jwt';
import type {
  AuthenticatedUser,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from '../types/auth';

let restoreTask: Promise<AuthenticatedUser | null> | null = null;

async function restoreActiveSession(): Promise<AuthenticatedUser | null> {
  const accessToken = await tokenStorage.getAccessToken();
  const user = accessToken ? getUserFromToken(accessToken) : null;
  if (user) return user;

  const refreshToken = await tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const { data } = await axios.post<LoginResponse>(
      '/refresh',
      { refreshToken },
      { baseURL: apiClient.defaults.baseURL, timeout: 15000 },
    );
    if (await tokenStorage.getRefreshToken() !== refreshToken) return null;
    const refreshedUser = getUserFromToken(data.token);
    if (!refreshedUser) {
      await tokenStorage.clear();
      return null;
    }
    await tokenStorage.setTokens(data);
    return refreshedUser;
  } catch (error) {
    if (isAxiosError(error) && isSessionRejection(error.response?.status)) {
      if (await tokenStorage.getRefreshToken() === refreshToken) {
        await tokenStorage.clear();
      }
      return null;
    }
    // Preserve tokens on network failures so the user can retry session recovery.
    throw error;
  }
}

export const authService = {
  async login(request: LoginRequest): Promise<AuthenticatedUser> {
    const { data } = await apiClient.post<LoginResponse>('/login', request);
    const user = getUserFromToken(data.token);
    if (!user) throw new Error('Invalid access token returned by the server.');
    await tokenStorage.setTokens(data);
    return user;
  },

  async register(request: RegisterRequest): Promise<RegisterResponse> {
    const { data } = await apiClient.post<RegisterResponse>('/register', request);
    return data;
  },

  restoreSession(): Promise<AuthenticatedUser | null> {
    if (!restoreTask) {
      restoreTask = restoreActiveSession().finally(() => { restoreTask = null; });
    }
    return restoreTask;
  },

  async logout(): Promise<void> {
    const refreshToken = await tokenStorage.getRefreshToken();
    // Clear local credentials before the network call to prevent refresh during logout.
    await tokenStorage.clear();
    if (!refreshToken) return;
    try {
      await axios.post('/logout', { refreshToken }, {
        baseURL: apiClient.defaults.baseURL,
        timeout: 3500,
      });
    } catch {
      // A network failure must not prevent local sign-out.
    }
  },
};
