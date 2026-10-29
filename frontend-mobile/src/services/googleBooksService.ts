import axios from 'axios';
import type { StudyBook } from '../types/studyBook';

interface GoogleVolume {
  id?: string;
  volumeInfo?: {
    title?: string;
    authors?: string[];
    publishedDate?: string;
    description?: string;
    infoLink?: string;
  };
}

interface GoogleBooksResponse {
  items?: GoogleVolume[];
}

function plainText(value?: string): string | null {
  if (!value) return null;
  const stripped = value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return stripped || null;
}

export const googleBooksService = {
  async search(topic: string, signal?: AbortSignal): Promise<StudyBook[]> {
    const term = topic.trim();
    if (!term || term.length > 80) {
      throw new Error('Enter a subject up to 80 characters.');
    }

    const response = await axios.get<GoogleBooksResponse>('https://www.googleapis.com/books/v1/volumes', {
      params: { q: term, maxResults: 10, printType: 'books' },
      timeout: 12000,
      signal,
    });

    return (response.data.items ?? [])
      .filter((item): item is GoogleVolume & { id: string } => Boolean(item.id && item.volumeInfo?.title))
      .map((item) => ({
        id: item.id,
        title: item.volumeInfo?.title ?? '',
        authors: (item.volumeInfo?.authors ?? []).filter((author): author is string => typeof author === 'string'),
        publishedDate: item.volumeInfo?.publishedDate ?? null,
        description: plainText(item.volumeInfo?.description),
        infoLink: typeof item.volumeInfo?.infoLink === 'string' && item.volumeInfo.infoLink.startsWith('https://')
          ? item.volumeInfo.infoLink : null,
      }));
  },
};
