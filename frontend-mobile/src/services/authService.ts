import axios, { isAxiosError } from 'axios';
import { apiClient } from './apiClient';
import { tokenStorage } from './tokenStorage';
import { getUserFromToken } from '../utils/jwt';
import type {
  AuthenticatedUser,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from '../types/auth';

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

  async restoreSession(): Promise<AuthenticatedUser | null> {
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
      const refreshedUser = getUserFromToken(data.token);
      if (!refreshedUser) {
        await tokenStorage.clear();
        return null;
      }
      await tokenStorage.setTokens(data);
      return refreshedUser;
    } catch (error) {
      if (isAxiosError(error) &&
          [400, 401, 403].includes(error.response?.status ?? 0)) {
        await tokenStorage.clear();
      }
      return null;
    }
  },

  async logout(): Promise<void> {
    await tokenStorage.clear();
  },
};
