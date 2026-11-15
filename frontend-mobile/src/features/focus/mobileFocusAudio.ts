import { Platform } from 'react-native';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import type { Soundscape } from './pomodoroState';
import { synthesizeCue, synthesizeStudySound } from './soundSynthesis';

type Cue = 'start' | 'pause' | 'complete';

async function cachedSound(kind: Soundscape | Cue, isCue: boolean): Promise<{uri:string;release():void}> {
  if (Platform.OS === 'web') {
    const bytes = isCue ? synthesizeCue(kind as Cue) : synthesizeStudySound(kind as Soundscape);
    const uri = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: 'audio/wav' }));
    return { uri, release: () => URL.revokeObjectURL(uri) };
  }
  // Fixed, app-owned names: no user input or file paths.
  const file = new File(Paths.cache, `focus-studio-v1-${isCue ? 'cue-' : ''}${kind}.wav`);
  if (!file.exists || file.size < 44) {
    const bytes = isCue ? synthesizeCue(kind as Cue) : synthesizeStudySound(kind as Soundscape);
    file.create({ overwrite: true });
    await file.write(bytes);
  }
  return { uri: file.uri, release() {} };
}

/**
 * Native Expo player wrapper. All tracks are synthesized on demand, kept in app
 * cache, and played without internet or account permissions.
 */
export class MobileFocusAudio {
  private player: AudioPlayer | null = null;
  private cues = new Set<AudioPlayer>();
  private cueTimers = new Set<ReturnType<typeof setTimeout>>();
  private sources = new Set<() => void>();
  private generation = 0;
  private disposed = false;

  async play(style: Soundscape, volume: number): Promise<boolean> {
    this.stop();
    const generation = this.generation;
    try {
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        interruptionMode: 'mixWithOthers',
      });
      const source = await cachedSound(style, false);
      if (this.disposed || generation !== this.generation) { source.release(); return false; }
      this.sources.add(source.release);
      const player = createAudioPlayer({ uri: source.uri });
      player.loop = true;
      player.volume = Math.max(0, Math.min(1, volume)) * 0.9;
      this.player = player;
      player.play();
      return true;
    } catch {
      if (generation === this.generation) this.stop();
      return false;
    }
  }

  volume(value: number): void {
    if (this.player) this.player.volume = Math.max(0, Math.min(1, value)) * 0.9;
  }

  async cue(kind: Cue, volume: number): Promise<void> {
    if (this.disposed || volume <= 0) return;
    const generation = this.generation;
    let release: (() => void) | null = null;
    try {
      const source = await cachedSound(kind, true);
      release = source.release;
      if (this.disposed || generation !== this.generation) { source.release(); return; }
      this.sources.add(source.release);
      const player = createAudioPlayer({ uri: source.uri });
      player.volume = Math.min(1, volume) * 0.7;
      this.cues.add(player);
      player.play();
      const timeout = setTimeout(() => {
        this.cueTimers.delete(timeout);
        this.cues.delete(player);
        player.release(); this.sources.delete(source.release); source.release();
      }, 2200);
      this.cueTimers.add(timeout);
    } catch {
      if (release) { this.sources.delete(release); release(); }
      // Optional notification chimes must not interrupt studying.
    }
  }

  stop(): void {
    this.generation++;
    if (this.player) {
      try { this.player.pause(); this.player.release(); } catch { /* Already released */ }
      this.player = null;
    }
    for (const timeout of this.cueTimers) clearTimeout(timeout);
    this.cueTimers.clear();
    for (const player of this.cues) {
      try { player.release(); } catch { /* Already released */ }
    }
    this.cues.clear();
    for (const release of this.sources) release();
    this.sources.clear();
  }

  dispose(): void {
    this.disposed = true;
    this.stop();
  }
}
