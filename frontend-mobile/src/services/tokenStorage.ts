import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { LoginResponse } from '../types/auth';

const ACCESS_TOKEN_KEY = 'studystreak.accessToken';
const REFRESH_TOKEN_KEY = 'studystreak.refreshToken';

// Expo SecureStore is not available on web. Keep tokens in memory for web preview.
const webTokens = new Map<string, string>();

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
  getAccessToken: () => read(ACCESS_TOKEN_KEY),
  getRefreshToken: () => read(REFRESH_TOKEN_KEY),
  async setTokens(tokens: LoginResponse): Promise<void> {
    await write(ACCESS_TOKEN_KEY, tokens.token);
    await write(REFRESH_TOKEN_KEY, tokens.refreshToken);
  },
  async clear(): Promise<void> {
    await Promise.all([remove(ACCESS_TOKEN_KEY), remove(REFRESH_TOKEN_KEY)]);
  },
};
