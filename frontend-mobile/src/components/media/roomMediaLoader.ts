import type { ComponentType } from 'react';

export type RoomMediaProps = { roomId: string };

export function supportsRoomMedia(runtime: { os: string; expoGo: boolean; webRTC: unknown; liveKit: unknown }): boolean {
  return (runtime.os === 'android' || runtime.os === 'ios') && !runtime.expoGo &&
    runtime.webRTC != null && runtime.liveKit != null;
}

// Recheck before evaluating the SDK, even when an already-open lazy element
// survives a development refresh. Never resolve React.lazy with an absent export.
export function createRoomMediaLoader(
  supported: () => boolean,
  load: () => Promise<unknown>,
  fallback: ComponentType<RoomMediaProps>,
): () => Promise<{ default: ComponentType<RoomMediaProps> }> {
  return async () => {
    try {
      if (!supported()) return { default: fallback };
      const module = await load();
      if (module && typeof module === 'object' && 'default' in module && typeof module.default === 'function') {
        return { default: module.default as ComponentType<RoomMediaProps> };
      }
    } catch { /* Missing native modules/import failures degrade to the same UI. */ }
    return { default: fallback };
  };
}
