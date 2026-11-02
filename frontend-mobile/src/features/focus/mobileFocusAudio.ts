import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import type { Soundscape } from './pomodoroState';
import { synthesizeCue, synthesizeStudySound } from './soundSynthesis';

type Cue = 'start' | 'pause' | 'complete';

async function cachedSound(kind: Soundscape | Cue, isCue: boolean): Promise<string> {
  // Fixed, app-owned names: no user input or file paths.
  const file = new File(Paths.cache, `focus-studio-v1-${isCue ? 'cue-' : ''}${kind}.wav`);
  if (!file.exists || file.size < 44) {
    const bytes = isCue ? synthesizeCue(kind as Cue) : synthesizeStudySound(kind as Soundscape);
    file.create({ overwrite: true });
    await file.write(bytes);
  }
  return file.uri;
}

/**
 * Native Expo player wrapper. All tracks are synthesized on demand, kept in app
 * cache, and played without internet or account permissions.
 */
export class MobileFocusAudio {
  private player: AudioPlayer | null = null;
  private cues = new Set<AudioPlayer>();
  private cueTimers = new Set<ReturnType<typeof setTimeout>>();
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
      const uri = await cachedSound(style, false);
      if (this.disposed || generation !== this.generation) return false;
      const player = createAudioPlayer({ uri });
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
    try {
      const uri = await cachedSound(kind, true);
      if (this.disposed || generation !== this.generation) return;
      const player = createAudioPlayer({ uri });
      player.volume = Math.min(1, volume) * 0.7;
      this.cues.add(player);
      player.play();
      const timeout = setTimeout(() => {
        this.cueTimers.delete(timeout);
        this.cues.delete(player);
        player.release();
      }, 2200);
      this.cueTimers.add(timeout);
    } catch {
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
  }

  dispose(): void {
    this.disposed = true;
    this.stop();
  }
}
