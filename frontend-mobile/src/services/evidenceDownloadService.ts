import { File, Paths } from 'expo-file-system';
import { apiClient } from './apiClient';
import { assertSessionRevision, getSessionRevision } from './authSession';

export async function downloadEvidence(url: string, extension: 'jpg' | 'm4a', attempt = 0, signal?: AbortSignal): Promise<File> {
  const revision = getSessionRevision();
  const check = () => { assertSessionRevision(revision); if (signal?.aborted) throw new Error('Evidence download cancelled.'); };
  const filename = `studystreak-${extension}-retry${attempt}-${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  const file = new File(Paths.cache, filename);

  try {
    const config = {
      signal, _sessionRevision: revision, responseType: 'arraybuffer' as const, adapter: 'fetch', timeout: 30000, maxContentLength: 2 * 1024 * 1024,
    };
    const response = await apiClient.get<ArrayBuffer>(url, config);
    if (!(response.data instanceof ArrayBuffer) || response.data.byteLength === 0) {
      throw new Error('The downloaded evidence is empty or invalid.');
    }

    check();
    if (response.data.byteLength > 2 * 1024 * 1024) throw new Error('Evidence exceeds 2 MiB.');
    file.create();
    await file.write(response.data);
    check();
    if (!file.exists || file.size === 0) throw new Error('The downloaded evidence could not be saved.');
    return file;
  } catch (cause) {
    if (file.exists) file.delete();
    throw cause;
  }
}
