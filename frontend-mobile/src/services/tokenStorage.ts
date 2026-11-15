import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { LoginResponse } from '../types/auth';
import { assertSessionRevision, beginSessionChange, getSessionRevision } from './authSession';

const ACCESS_TOKEN_KEY = 'studystreak.accessToken';
const REFRESH_TOKEN_KEY = 'studystreak.refreshToken';

// Expo SecureStore is not available on web. Keep tokens in memory for web preview.
const webTokens = new Map<string, string>();

// Serialize pairs of SecureStore writes/deletions so logout cannot be undone
// by a refresh that was already writing its credentials.
let storageTask: Promise<unknown> = Promise.resolve();
function enqueue<T>(operation: () => Promise<T>): Promise<T> {
  const task = storageTask.then(operation);
  storageTask = task.catch(() => {});
  return task;
}

async function read(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return webTokens.get(key) ?? null;
  return SecureStore.getItemAsync(key);
}

async function write(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    webTokens.set(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function remove(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    webTokens.delete(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export const tokenStorage = {
  getAccessToken: () => enqueue(() => read(ACCESS_TOKEN_KEY)),
  getRefreshToken: () => enqueue(() => read(REFRESH_TOKEN_KEY)),
  setTokens(tokens: LoginResponse, revision = getSessionRevision()): Promise<void> {
    return enqueue(async () => {
      assertSessionRevision(revision);
      await write(ACCESS_TOKEN_KEY, tokens.token);
      await write(REFRESH_TOKEN_KEY, tokens.refreshToken);
      assertSessionRevision(revision);
    });
  },
  clear(revision = getSessionRevision()): Promise<boolean> {
    if (revision !== getSessionRevision()) return Promise.resolve(false);
    beginSessionChange();
    return enqueue(async () => {
      await Promise.all([remove(ACCESS_TOKEN_KEY), remove(REFRESH_TOKEN_KEY)]);
      return true;
    });
  },
};
