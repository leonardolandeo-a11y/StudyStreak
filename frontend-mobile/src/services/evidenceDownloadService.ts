import { File, Paths } from 'expo-file-system';
import { apiClient } from './apiClient';

export async function downloadEvidence(url: string, extension: 'jpg' | 'm4a', attempt = 0): Promise<File> {
  const filename = `studystreak-${extension}-retry${attempt}-${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  const file = new File(Paths.cache, filename);

  try {
    const response = await apiClient.get<ArrayBuffer>(url, {
      responseType: 'arraybuffer', adapter: 'fetch', timeout: 30000, maxContentLength: 2 * 1024 * 1024,
    });
    if (!(response.data instanceof ArrayBuffer) || response.data.byteLength === 0) {
      throw new Error('The downloaded evidence is empty or invalid.');
    }

    file.create();
    await file.write(response.data);
    if (!file.exists || file.size === 0) throw new Error('The downloaded evidence could not be saved.');
    return file;
  } catch (cause) {
    if (file.exists) file.delete();
    throw cause;
  }
}
