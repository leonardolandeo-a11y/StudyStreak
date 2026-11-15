export const players = [];
export const audioModes = [];
let nextMode;
export function deferNextMode(callback) { nextMode = callback; }
export async function setAudioModeAsync(value) {
  audioModes.push(value);
  if (nextMode) { const action = nextMode; nextMode = undefined; await action(); }
}
export function createAudioPlayer(source) {
  const listeners = new Set();
  const player = { source, playing: false, released: false, volume: 1, loop: false, isLoaded: true, currentTime: 0, duration: 100,
    addListener(_event,listener) { listeners.add(listener); return {remove(){listeners.delete(listener);}}; },
    emit(status) { if(status.playing!==undefined)this.playing=status.playing; for(const listener of [...listeners])listener({isLoaded:true,didJustFinish:false,error:null,...status}); },
    async seekTo(value) { this.currentTime=value; },
    play() { this.playing = true; }, pause() { this.playing = false; }, release() { this.playing = false; this.released = true; listeners.clear(); } };
  players.push(player); return player;
}
