import { isAxiosError } from 'axios';

type ApiErrorBody = { message?: string; detail?: string; title?: string };

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!isAxiosError(error)) return fallback;
  if (error.code === 'ECONNABORTED') return 'The request timed out. Try again.';
  if (!error.response) return 'Cannot connect to StudyStreak. Check your connection and API address.';
  const status = error.response.status;
  if (status === 401) return 'Your session has expired or your credentials are incorrect.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 404) return 'The requested resource was not found.';
  if (status >= 500) return 'The server is temporarily unavailable. Please try again.';
  const data = error.response.data as ApiErrorBody | undefined;
  if (data && typeof data === 'object' && typeof data.message === 'string' && data.message.trim()) {
    return data.message;
  }
  if (status === 409) return 'This record already exists or conflicts with another one.';
  if (status === 400) return 'Please check the information you entered.';
  return fallback;
}
