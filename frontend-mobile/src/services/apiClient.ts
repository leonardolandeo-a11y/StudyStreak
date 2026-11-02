import {
  create,
  isAxiosError,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';
import { tokenStorage } from './tokenStorage';
import { isSessionRejection, notifySessionExpired } from './authSession';
import { getUserFromToken } from '../utils/jwt';
import type { LoginResponse } from '../types/auth';

const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

export const apiClient = create({
  baseURL: apiBaseUrl,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };
let refreshTask: Promise<LoginResponse> | null = null;

apiClient.interceptors.request.use(async (config) => {
  if (!apiBaseUrl) {
    throw new Error('EXPO_PUBLIC_API_URL is not configured');
  }

  const accessToken = await tokenStorage.getAccessToken();
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;
    const isAuthEndpoint = /^\/(login|register|refresh|logout)(\?|$)/.test(original?.url ?? '');

    if (error.response?.status !== 401 || !original || isAuthEndpoint) {
      return Promise.reject(error);
    }

    if (original._retry) {
      const currentAccess = await tokenStorage.getAccessToken();
      if (currentAccess && original.headers.get('Authorization') === `Bearer ${currentAccess}`) {
        await tokenStorage.clear();
        notifySessionExpired();
      }
      return Promise.reject(error);
    }

    original._retry = true;
    const refreshToken = await tokenStorage.getRefreshToken();
    if (!refreshToken) {
      await tokenStorage.clear();
      notifySessionExpired();
      return Promise.reject(error);
    }

    try {
      const currentAccess = await tokenStorage.getAccessToken();
      const requestAccess = original.headers.get('Authorization');
      if (currentAccess && requestAccess !== `Bearer ${currentAccess}`) {
        original.headers.set('Authorization', `Bearer ${currentAccess}`);
        return apiClient(original);
      }
      if (!refreshTask) {
        refreshTask = create({ timeout: 15000 })
          .post<LoginResponse>(`${apiBaseUrl}/refresh`, { refreshToken })
          .then(async (response) => {
            if (!getUserFromToken(response.data.token)) {
              throw new Error('Invalid access token returned by refresh.');
            }
            if (await tokenStorage.getRefreshToken() !== refreshToken) {
              throw new Error('Authentication session changed during refresh');
            }
            await tokenStorage.setTokens(response.data);
            return response.data;
          })
          .finally(() => { refreshTask = null; });
      }

      const tokens = await refreshTask;
      original.headers.set('Authorization', `Bearer ${tokens.token}`);
      return apiClient(original);
    } catch (refreshError) {
      if (isAxiosError(refreshError) && isSessionRejection(refreshError.response?.status) &&
          await tokenStorage.getRefreshToken() === refreshToken) {
        await tokenStorage.clear();
        notifySessionExpired();
      }
      return Promise.reject(refreshError);
    }
  },
);
