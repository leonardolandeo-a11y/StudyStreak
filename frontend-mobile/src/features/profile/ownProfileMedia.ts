import { Directory, File, Paths } from 'expo-file-system';
import { isAxiosError } from 'axios';
import { apiClient } from '../../services/apiClient';
import { assertSessionRevision, getSessionRevision } from '../../services/authSession';
import type { ProfileImageSlot } from '../../services/ownProfileService';
import { PROFILE_LIMITS, profileImageError } from './profileValidation';

export interface ProfileImageDraft { uri: string; type: string; size: number; name: string; }
export type ImageChange = ProfileImageDraft | 'remove' | null;
export interface SelectedProfileAsset { uri: string; mimeType?: string | null; fileName?: string | null; fileSize?: number; width: number; height: number; }
export function imageMime(bytes: Uint8Array): string | null {
  if (bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((value,index) => bytes[index] === value)) return 'image/png';
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0,4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8,12)) === 'WEBP') return 'image/webp';
  return null;
}
export function cleanStaleProfileMedia(kind: 'own' | 'social' = 'own') {
  try {
    for (const entry of new Directory(Paths.cache).list()) {
      if (entry instanceof File && (kind === 'own' ? /^(own-profile-|own-avatar-)/ : /^social-profile-/).test(entry.name)) entry.delete();
    }
  } catch { /* Unsupported web filesystem or OS-evicted cache; never touch library originals. */ }
}
/** One instance per authenticated provider lifetime. No tokens or account-global image cache. */
export class OwnProfileMedia {
  private controller = new AbortController();
  private revision = getSessionRevision();
  private files = new Map<string, File>();
  private downloads = new Map<ProfileImageSlot, Promise<string | null>>();
  private sequence = 0;
  private prefix: string;
  private resource: string;
  constructor(userId: number, resource = '/api/profile', kind: 'own' | 'social' = 'own') { this.resource = resource; this.prefix = `${kind}-profile-${userId}-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
  private check() {
    if (this.controller.signal.aborted) throw new Error('Profile image request cancelled.');
    assertSessionRevision(this.revision);
  }
  private async cache(bytes: Uint8Array, type: string): Promise<File> {
    this.check();
    const extension = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
    const file = new File(Paths.cache, `${this.prefix}-${++this.sequence}.${extension}`);
    this.files.set(file.uri, file);
    try { file.create(); await file.write(bytes); this.check(); return file; }
    catch(error) { this.release(file.uri); if (file.exists) file.delete(); throw error; }
  }
  load(slot: ProfileImageSlot): Promise<string | null> {
    this.check();
    const existing = this.downloads.get(slot);
    if (existing) return existing;
    const task = this.download(slot).catch(error => { if (this.downloads.get(slot) === task) this.downloads.delete(slot); throw error; });
    this.downloads.set(slot, task); return task;
  }
  private async download(slot: ProfileImageSlot): Promise<string | null> {
    try {
      const response = await apiClient.get<ArrayBuffer>(`${this.resource}/${slot}`, { signal: this.controller.signal, ...{ _sessionRevision: this.revision },
        responseType: 'arraybuffer', adapter: 'fetch', timeout: 30000, maxContentLength: PROFILE_LIMITS[slot] });
      this.check();
      if (!(response.data instanceof ArrayBuffer)) throw new Error('Invalid image response.');
      const bytes = new Uint8Array(response.data);
      const type = String(response.headers['content-type']).split(';')[0].trim().toLowerCase();
      const invalid = profileImageError(slot, { type, size: bytes.byteLength });
      if (invalid || imageMime(bytes) !== type) throw new Error(invalid ?? 'Invalid image format.');
      return (await this.cache(bytes, type)).uri;
    } catch(error) {
      this.check();
      if (isAxiosError(error) && error.response?.status === 404) return null;
      throw error;
    }
  }
  async prepare(slot: ProfileImageSlot, asset: SelectedProfileAsset): Promise<ProfileImageDraft> {
    this.check();
    const source = new File(asset.uri);
    try {
      if (!Number.isFinite(asset.width) || !Number.isFinite(asset.height) || asset.width <= 0 || asset.height <= 0 ||
        asset.width > 8192 || asset.height > 8192 || asset.width * asset.height > 16000000) throw new Error('Choose an image up to 8192 pixels per side and 16 million pixels.');
      if (asset.fileSize && asset.fileSize > PROFILE_LIMITS[slot] || source.size > PROFILE_LIMITS[slot]) throw new Error(`${slot === 'avatar' ? 'Avatar' : 'Banner'} must be ${slot === 'avatar' ? 2 : 5} MiB or smaller.`);
      const bytes = new Uint8Array(await source.arrayBuffer()); this.check();
      const type = imageMime(bytes);
      const invalid = profileImageError(slot, { type: type ?? '', size: bytes.byteLength });
      if (invalid) throw new Error(invalid);
      if (asset.mimeType && asset.mimeType !== type) throw new Error('Image format does not match its content. Choose PNG, JPEG or WebP.');
      const file = await this.cache(bytes, type!);
      return { uri: file.uri, type: type!, size: bytes.byteLength, name: asset.fileName || `Selected ${slot}` };
    } finally {
      // Only remove picker-generated files inside our app cache, never photo-library originals.
      const pickerCache = new Directory(Paths.cache, 'ImagePicker').uri + '/';
      if (asset.uri.startsWith(pickerCache)) { try { if (source.exists) source.delete(); } catch { /* OS can evict picker cache. */ } }
    }
  }

  async bytes(draft: ProfileImageDraft): Promise<ArrayBuffer> {
    this.check(); const file = this.files.get(draft.uri);
    if (!file) throw new Error('Selected image is no longer available. Select it again.');
    const bytes = await file.arrayBuffer(); this.check(); return bytes;
  }
  release(uri: string) { const file = this.files.get(uri); this.files.delete(uri); try { if (file?.exists) file.delete(); } catch { /* OS cache cleanup is best effort. */ } }
  invalidate(slot: ProfileImageSlot) {
    const previous = this.downloads.get(slot); this.downloads.delete(slot);
    if (previous) void previous.then(uri => { if (uri) this.release(uri); }).catch(() => {});
  }
  dispose() { this.controller.abort(); this.downloads.clear(); for (const uri of this.files.keys()) this.release(uri); }
}
