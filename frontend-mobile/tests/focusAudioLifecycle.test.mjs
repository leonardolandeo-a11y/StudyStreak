import './helpers/appearanceTestLoader.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import { players, deferNextMode } from './helpers/focusAudioMock.mjs';
import { files } from './helpers/appearanceFileSystemMock.mjs';
const { MobileFocusAudio } = await import('../src/features/focus/mobileFocusAudio.ts');

test('existing offline synthesis caches a real WAV, switches without overlap and clamps volume', async () => {
  const audio = new MobileFocusAudio();
  try {
    assert.equal(await audio.play('dream', .5), true);
    const first = players.at(-1);
    const bytes = files.get(first.source.uri);
    assert.equal(String.fromCharCode(...bytes.slice(0, 4)), 'RIFF');
    assert.equal(first.loop, true);
    assert.equal(await audio.play('rain', .5), true);
    assert.equal(first.released, true); assert.equal(players.at(-1).playing, true);
    audio.volume(2); assert.equal(players.at(-1).volume, .9);
    audio.volume(-1); assert.equal(players.at(-1).volume, 0);
    audio.stop(); assert.equal(players.at(-1).released, true);
  } finally { audio.dispose(); }
});
test('leaving while audio is preparing prevents late playback from starting', async () => {
  const audio = new MobileFocusAudio(); let finish;
  deferNextMode(() => new Promise(resolve => { finish = resolve; }));
  const count = players.length;
  const pending = audio.play('ocean', .5); audio.stop(); finish();
  assert.equal(await pending, false); assert.equal(players.length, count); audio.dispose();
});
test('an obsolete sound preparation cannot replace a newer track', async () => {
  const audio = new MobileFocusAudio(); let finish;
  deferNextMode(() => new Promise(resolve => { finish = resolve; }));
  const obsolete = audio.play('forest', .5);
  try {
    assert.equal(await audio.play('lofi', .5), true);
    const current = players.at(-1); finish();
    assert.equal(await obsolete, false); assert.equal(current.playing, true);
    await audio.cue('pause', .5); audio.dispose();
    assert.equal(current.released, true); assert.equal(players.at(-1).released, true);
    assert.equal(await audio.play('rain', .5), false);
  } finally { finish?.(); audio.dispose(); }
});
