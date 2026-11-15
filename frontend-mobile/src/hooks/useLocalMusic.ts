import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { LocalMusic } from '../features/focus/localMusic';
import { MAX_LOCAL_TRACKS, pickLocalMusic } from '../features/focus/localMusicPicker';
export function useLocalMusic(silenceSoundscapes: () => void, volume: number) {
  const [library] = useState(() => new LocalMusic());
  const state = useSyncExternalStore(library.subscribe, library.getSnapshot, library.getSnapshot);
  const [importing,setImporting] = useState(false), [importError,setImportError] = useState<string | null>(null);
  const picker = useRef<AbortController | null>(null);
  const scope = useRef({ active: false, revision: 0 });
  useFocusEffect(useCallback(() => {
    scope.current.active = true;
    return () => { scope.current.active = false; scope.current.revision++; picker.current?.abort(); library.clear(); setImporting(false); setImportError(null); };
  }, [library]));
  useEffect(() => { library.volume(volume); }, [library, volume]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => { if (state !== 'active') library.pause(); });
    return () => { sub.remove(); library.clear(); };
  }, [library]);
  async function importMusic() {
    if (importing || !scope.current.active) return;
    const controller = new AbortController(); picker.current = controller;
    const revision = ++scope.current.revision; setImporting(true); setImportError(null);
    try {
      const tracks = await pickLocalMusic(MAX_LOCAL_TRACKS - library.getSnapshot().tracks.length, controller.signal);
      if (!scope.current.active || scope.current.revision !== revision) tracks.forEach(track => track.release());
      else library.add(tracks);
    } catch (cause) { if (scope.current.active && scope.current.revision === revision) setImportError(cause instanceof Error ? cause.message : 'Music could not be imported.'); }
    finally { if (scope.current.active && scope.current.revision === revision) setImporting(false); }
  }
  return { ...state, importing, importError, importMusic, pause: library.pause, deactivate: library.deactivate, remove: library.remove,
    play: (id: string) => library.play(id, volume, silenceSoundscapes) };
}
