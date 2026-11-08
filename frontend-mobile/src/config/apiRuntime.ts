import { requireApiBaseUrl } from './api';

export class ApiConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiConfigurationError';
  }
}

// Keep the existing validator as the only source of configuration rules.
export function requireConfiguredApiBaseUrl(): string {
  try {
    return requireApiBaseUrl();
  } catch (error) {
    throw new ApiConfigurationError(error instanceof Error ? error.message : 'Invalid API configuration.');
  }
}
