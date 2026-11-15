import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
export interface LocalTrack { id: string; name: string; uri: string; release(): void }
interface MusicState { tracks: LocalTrack[]; activeId: string | null; playing: boolean; loading: boolean; error: string | null }
/** One temporary player. Epochs cancel preparation/seek when another audio source wins. */
export class LocalMusic {
  private state: MusicState = { tracks: [], activeId: null, playing: false, loading: false, error: null };
  private listeners = new Set<() => void>();
  private player: AudioPlayer | null = null;
  private subscription: { remove(): void } | null = null;
  private generation = 0;
  private finished = false;
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private publish(patch: Partial<MusicState>) { this.state = { ...this.state, ...patch }; this.listeners.forEach(listener => listener()); }
  add(tracks: LocalTrack[]) { this.publish({ tracks: [...this.state.tracks, ...tracks], error: null }); }
  private releasePlayer() {
    this.subscription?.remove(); this.subscription = null;
    try { this.player?.pause(); this.player?.release(); } catch { /* Already released. */ }
    this.player = null; this.finished = false;
  }
  async play(id: string, volume: number, silenceSoundscapes: () => void) {
    const track = this.state.tracks.find(item => item.id === id); if (!track) return;
    const epoch = ++this.generation;
    const resume = this.state.activeId === id && this.player !== null;
    if (!resume) this.releasePlayer();
    silenceSoundscapes();
    this.publish({ activeId: id, loading: true, error: null, playing: false });
    try {
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true, interruptionMode: 'mixWithOthers' });
      if (epoch !== this.generation) return;
      if (!this.player) {
        const player = createAudioPlayer({ uri: track.uri }); this.player = player;
        player.loop = false;
        this.subscription = player.addListener('playbackStatusUpdate', status => {
          if (this.player !== player) return;
          if (status.error) { this.generation++; this.releasePlayer(); this.publish({ loading: false, playing: false, error: 'This track could not be played on this device. Try a different audio file.' }); return; }
          this.finished = status.didJustFinish;
          this.publish({ playing: status.playing, loading: !status.isLoaded && !status.didJustFinish });
        });
      }
      const player = this.player;
      if (this.finished || (player.duration > 0 && player.currentTime >= player.duration)) await player.seekTo(0);
      if (epoch !== this.generation || player !== this.player) return;
      this.finished = false; player.volume = Math.max(0,Math.min(1,volume)) * .9; player.play();
      this.publish({ playing: true, loading: !player.isLoaded });
    } catch {
      if (epoch === this.generation) { this.releasePlayer(); this.publish({ playing: false, loading: false, error: 'This track could not be played on this device. Try a different audio file.' }); }
    }
  }
  pause = () => { this.generation++; try { this.player?.pause(); } catch { this.releasePlayer(); } this.publish({ playing: false, loading: false }); };
  deactivate = () => { this.generation++; this.releasePlayer(); this.publish({ activeId: null, playing: false, loading: false, error: null }); };
  volume(value: number) { if (this.player) this.player.volume = Math.max(0,Math.min(1,value)) * .9; }
  remove = (id: string) => {
    if (this.state.activeId === id) this.deactivate();
    const track = this.state.tracks.find(item => item.id === id);
    try { track?.release(); } catch { /* Cache may already have been reclaimed. */ }
    this.publish({ tracks: this.state.tracks.filter(item => item.id !== id) });
  };
  clear = () => { this.deactivate(); for (const track of this.state.tracks) { try { track.release(); } catch { /* Cache reclaimed. */ } } this.publish({ tracks: [], error: null }); };
}
