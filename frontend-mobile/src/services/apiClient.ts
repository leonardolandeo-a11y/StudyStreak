import {
  create,
  isAxiosError,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';
import { tokenStorage } from './tokenStorage';
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
    const isAuthEndpoint = /^\/(login|register|refresh)(\?|$)/.test(original?.url ?? '');

    if (error.response?.status !== 401 || !original || original._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    original._retry = true;
    const refreshToken = await tokenStorage.getRefreshToken();
    if (!refreshToken) return Promise.reject(error);

    try {
      const currentAccess = await tokenStorage.getAccessToken();
      const requestAccess = original.headers.get('Authorization');
      if (currentAccess && requestAccess !== `Bearer ${currentAccess}`) {
        original.headers.set('Authorization', `Bearer ${currentAccess}`);
        return apiClient(original);
      }
      if (!refreshTask) {
        refreshTask = create({ timeout: 15000 })
          .post<LoginResponse>(`${apiBaseUrl}/refresh`, { refreshToken }, { timeout: 15000 })
          .then(async (response) => {
            // Persist before releasing the single-flight promise to other requests.
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
      if (isAxiosError(refreshError) && [400, 401, 403].includes(refreshError.response?.status ?? 0)) {
        await tokenStorage.clear();
      }
      return Promise.reject(refreshError);
    }
  },
);
