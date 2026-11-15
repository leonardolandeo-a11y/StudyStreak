import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
import type { LocalTrack } from './localMusic';
export const MAX_LOCAL_TRACKS = 10;
export const MAX_TRACK_BYTES = 50 * 1024 * 1024;
let sequence = 0;
export function validAudio(name: string, type: string, size: number) {
  return size > 0 && size <= MAX_TRACK_BYTES && (type.startsWith('audio/') || /\.(mp3|m4a|aac|wav|ogg|flac|aiff|aif|opus)$/i.test(name));
}
export async function pickLocalMusic(capacity: number, signal?: AbortSignal): Promise<LocalTrack[]> {
  if (capacity <= 0) throw new Error('Remove a track before importing more music.');
  if (Platform.OS === 'web') {
    const files = await new Promise<globalThis.File[]>(resolve => {
      const input = document.createElement('input'); input.type = 'file'; input.accept = 'audio/*'; input.multiple = true;
      input.setAttribute('aria-label', 'Choose local audio files'); input.style.display = 'none'; document.body.append(input);
      const abort = () => finish([]);
      const finish = (files: globalThis.File[]) => { signal?.removeEventListener('abort', abort); input.remove(); resolve(files); };
      if (signal?.aborted) { finish([]); return; }
      signal?.addEventListener('abort', abort, { once: true });
      input.addEventListener('change', () => finish(Array.from(input.files ?? [])), { once: true });
      input.addEventListener('cancel', () => finish([]), { once: true }); input.click();
    });
    if (signal?.aborted) return [];
    if (files.length > capacity) throw new Error(`Choose up to ${capacity} audio files.`);
    if (files.some(file => !validAudio(file.name,file.type,file.size))) throw new Error('Choose audio files between 1 byte and 50 MB.');
    return files.map(file => { const uri = URL.createObjectURL(file); return { id: `local-${++sequence}`, name: file.name, uri, release: () => URL.revokeObjectURL(uri) }; });
  }
  const result = await File.pickFileAsync({ multipleFiles: true, mimeTypes: ['audio/*'] });
  if (signal?.aborted || result.canceled) return [];
  if (result.result.length > capacity) throw new Error(`Choose up to ${capacity} audio files.`);
  if (result.result.some(file => !validAudio(file.name,file.type,file.size))) throw new Error('Choose audio files between 1 byte and 50 MB.');
  const tracks: LocalTrack[] = [];
  try {
    for (const source of result.result) {
      const id = `local-${Date.now()}-${++sequence}`;
      const owned = new File(Paths.cache, `focus-import-${id}${source.extension}`);
      try { source.copy(owned); } catch (cause) { try { if (owned.exists) owned.delete(); } catch { /* Cache may already be reclaimed. */ } throw cause; }
      tracks.push({ id, name: source.name, uri: owned.uri, release: () => { if (owned.exists) owned.delete(); } });
    }
    return tracks;
  } catch { tracks.forEach(track => track.release()); throw new Error('The selected audio could not be opened. Try a local file.'); }
}
