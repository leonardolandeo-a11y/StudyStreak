import axios, { isAxiosError } from 'axios';
import { requireConfiguredApiBaseUrl } from '../config/apiRuntime';
import { assertSessionRevision, isSessionRejection, notifySessionExpired } from './authSession';
import { tokenStorage } from './tokenStorage';
import { getUserFromToken } from '../utils/jwt';
import type { LoginResponse } from '../types/auth';

let refreshTask: { revision: number; task: Promise<LoginResponse> } | null = null;

// Restoration and 401 recovery must share the same refresh, including rotation.
export function refreshSession(revision: number): Promise<LoginResponse> {
  assertSessionRevision(revision);
  if (refreshTask?.revision === revision) return refreshTask.task;

  const task = (async () => {
    const baseURL = requireConfiguredApiBaseUrl();
    const refreshToken = await tokenStorage.getRefreshToken();
    assertSessionRevision(revision);
    if (!refreshToken) throw new Error('No refresh session is available.');
    try {
      const { data } = await axios.post<LoginResponse>('/refresh', { refreshToken }, {
        baseURL, timeout: 15000,
      });
      assertSessionRevision(revision);
      if (!getUserFromToken(data.token) || typeof data.refreshToken !== 'string' || !data.refreshToken) {
        if (await tokenStorage.clear(revision)) notifySessionExpired();
        throw new Error('Invalid credentials returned by refresh.');
      }
      await tokenStorage.setTokens(data, revision);
      return data;
    } catch (error) {
      if (isAxiosError(error) && isSessionRejection(error.response?.status)) {
        if (await tokenStorage.clear(revision)) notifySessionExpired();
      }
      // Connectivity/configuration/server failures must preserve stored tokens.
      throw error;
    }
  })().finally(() => {
    if (refreshTask?.task === task) refreshTask = null;
  });
  refreshTask = { revision, task };
  return task;
}
