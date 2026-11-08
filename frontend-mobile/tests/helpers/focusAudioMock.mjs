export const players = [];
export const audioModes = [];
let nextMode;
export function deferNextMode(callback) { nextMode = callback; }
export async function setAudioModeAsync(value) {
  audioModes.push(value);
  if (nextMode) { const action = nextMode; nextMode = undefined; await action(); }
}
export function createAudioPlayer(source) {
  const player = { source, playing: false, released: false, volume: 1, loop: false,
    play() { this.playing = true; }, pause() { this.playing = false; }, release() { this.playing = false; this.released = true; } };
  players.push(player); return player;
}
