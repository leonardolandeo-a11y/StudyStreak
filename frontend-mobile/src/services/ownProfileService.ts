import { File, Paths } from 'expo-file-system';
import { apiClient } from './apiClient';

export interface OwnProfile {
  id: number; username: string; presentationName: string; displayName: string | null; bio: string | null;
  registrationDate?: string | null;
}
export async function getOwnProfile(signal: AbortSignal): Promise<OwnProfile> {
  return (await apiClient.get<OwnProfile>('/api/profile', { signal })).data;
}
export async function getOwnAvatar(userId: number, signal: AbortSignal): Promise<File> {
  const { data, headers } = await apiClient.get<ArrayBuffer>('/api/profile/avatar', {
    signal, responseType: 'arraybuffer', adapter: 'fetch', timeout: 30000, maxContentLength: 2 * 1024 * 1024,
  });
  if (!(data instanceof ArrayBuffer) || !data.byteLength || data.byteLength > 2 * 1024 * 1024 || signal.aborted) {
    throw new Error('Avatar is unavailable.');
  }
  const extension = String(headers['content-type']).includes('png') ? 'png' : 'jpg';
  const file = new File(Paths.cache, `own-avatar-${userId}-${Date.now()}.${extension}`);
  try {
    file.create(); await file.write(data);
    if (signal.aborted) throw new Error('Avatar request was cancelled.');
    return file;
  } catch (error) { if (file.exists) file.delete(); throw error; }
}
