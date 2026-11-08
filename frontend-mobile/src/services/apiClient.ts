import { create, type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { apiBaseUrl } from '../config/api';
import { requireConfiguredApiBaseUrl } from '../config/apiRuntime';
import { tokenStorage } from './tokenStorage';
import { assertSessionRevision, getSessionRevision, notifySessionExpired } from './authSession';
import { refreshSession } from './sessionRefresh';

export const apiClient = create({
  baseURL: apiBaseUrl,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean; _sessionRevision?: number };

apiClient.interceptors.request.use(async (config: RetryConfig) => {
  config.baseURL = requireConfiguredApiBaseUrl();
  const revision = config._sessionRevision ?? getSessionRevision();
  config._sessionRevision = revision;
  assertSessionRevision(revision);
  const accessToken = await tokenStorage.getAccessToken();
  assertSessionRevision(revision);
  if (accessToken) config.headers.set('Authorization', `Bearer ${accessToken}`);
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    assertSessionRevision((response.config as RetryConfig)._sessionRevision!);
    return response;
  },
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;
    const isAuthEndpoint = /^\/(login|register|refresh|logout)(\?|$)/.test(original?.url ?? '');
    if (original?._sessionRevision !== undefined) assertSessionRevision(original._sessionRevision);
    if (error.response?.status !== 401 || !original || isAuthEndpoint) return Promise.reject(error);

    const revision = original._sessionRevision!;
    if (original._retry) {
      const currentAccess = await tokenStorage.getAccessToken();
      assertSessionRevision(revision);
      if (original.headers.get('Authorization') === `Bearer ${currentAccess}` &&
          await tokenStorage.clear(revision)) notifySessionExpired();
      return Promise.reject(error);
    }

    original._retry = true;
    const currentAccess = await tokenStorage.getAccessToken();
    assertSessionRevision(revision);
    // A concurrent request may already have rotated this session's access token.
    if (currentAccess && original.headers.get('Authorization') !== `Bearer ${currentAccess}`) {
      return apiClient(original);
    }
    const refreshToken = await tokenStorage.getRefreshToken();
    assertSessionRevision(revision);
    if (!refreshToken) {
      if (await tokenStorage.clear(revision)) notifySessionExpired();
      return Promise.reject(error);
    }

    await refreshSession(revision);
    assertSessionRevision(revision);
    return apiClient(original);
  },
);
