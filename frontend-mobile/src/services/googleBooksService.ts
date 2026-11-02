import { isAxiosError } from 'axios';
import { apiClient } from './apiClient';
import type { StudyBook } from '../types/studyBook';

// Google Books may omit fields. Older backend responses also lack some
// optional metadata, so normalize before rendering a book detail screen.
function optionalText(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function textArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
}

function officialGoogleUrl(value: unknown): string | null {
  const url = optionalText(value);
  if (!url) return null;
  // Only allow official Google Books hosts, without custom ports or user info.
  if (!/^https?:\/\/(?:books\.google\.com|books\.googleusercontent\.com|play\.google\.com)(?:[/?#]|$)/i.test(url)) {
    return null;
  }
  return url.replace(/^http:/i, 'https:');
}

function normalizeBook(value: unknown): StudyBook | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const book = value as Partial<StudyBook>;
  const id = optionalText(book.id);
  const title = optionalText(book.title);
  if (!id || !title) return null;

  return {
    id,
    title,
    authors: textArray(book.authors),
    publishedDate: optionalText(book.publishedDate),
    description: optionalText(book.description),
    infoLink: officialGoogleUrl(book.infoLink)
      ?? `https://books.google.com/books?id=${encodeURIComponent(id)}`,
    thumbnailUrl: officialGoogleUrl(book.thumbnailUrl),
    previewLink: officialGoogleUrl(book.previewLink),
    publisher: optionalText(book.publisher),
    pageCount: typeof book.pageCount === 'number' && Number.isInteger(book.pageCount) && book.pageCount > 0
      ? book.pageCount : null,
    categories: textArray(book.categories),
  };
}

export const googleBooksService = {
  async search(topic: string, signal?: AbortSignal): Promise<StudyBook[]> {
    const term = topic.trim();
    if (term.length < 2 || term.length > 80) {
      throw new Error('Enter between 2 and 80 characters.');
    }

    const response = await apiClient.get<unknown>('/api/resources/books', {
      params: { q: term },
      timeout: 15000,
      signal,
    });
    if (!Array.isArray(response.data)) {
      throw new Error('Invalid Google Books response.');
    }
    return response.data
      .map(normalizeBook)
      .filter((book): book is StudyBook => book !== null);
  },
};

export function getBookSearchErrorMessage(error: unknown): string {
  if (!isAxiosError(error)) return 'Books could not be loaded. Try again.';
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return 'Book search timed out. Try again.';
  if (!error.response) return 'Cannot connect to StudyStreak. Check your connection and API address.';
  if (error.response.status === 401) return 'Your session has expired. Sign in again.';
  if (error.response.status === 403) return 'You do not have permission to search for books.';
  if (error.response.status === 429) return 'Google Books has reached its search limit. Try again later.';
  if (error.response.status === 503) return 'Google Books is not configured on the server.';
  if (error.response.status === 502 || error.response.status === 504) return 'Google Books is temporarily unavailable. Try again later.';
  return 'Books could not be loaded. Try again.';
}
