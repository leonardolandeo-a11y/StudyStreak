export function readApiConfiguration(value: string | undefined, variable = 'EXPO_PUBLIC_API_URL') {
  const baseUrl = value?.trim().replace(/\/+$/, '');
  if (!baseUrl) {
    return { error: `${variable} is missing. Configure it in .env.local and restart Expo.` };
  }
  try {
    const url = new URL(baseUrl);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
      throw new Error('Invalid API URL');
    }
    return { baseUrl };
  } catch {
    return { error: `${variable} must be an absolute HTTP(S) URL without credentials, query parameters or fragments.` };
  }
}

// Expo requires direct property access to inline this public variable in the bundle.
const configuration = readApiConfiguration(process.env.EXPO_PUBLIC_API_URL);
export const apiBaseUrl = configuration.baseUrl;
export const apiConfigurationError = configuration.error;

export function requireApiBaseUrl(): string {
  if (!apiBaseUrl) throw new Error(apiConfigurationError);
  return apiBaseUrl;
}
