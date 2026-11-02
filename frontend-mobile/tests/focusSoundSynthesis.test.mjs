import test from 'node:test';
import assert from 'node:assert/strict';
import { synthesizeStudySound, synthesizeCue } from '../src/features/focus/soundSynthesis.ts';
import { SOUNDSCAPES } from '../src/features/focus/soundscapes.ts';

const decoder = new TextDecoder();

test('all 12 mobile soundscapes are valid non-silent PCM WAV files', () => {
  const signatures = new Set();
  for (const sound of SOUNDSCAPES) {
    const bytes = synthesizeStudySound(sound.id, 0.3, 8000);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    assert.equal(decoder.decode(bytes.slice(0, 4)), 'RIFF');
    assert.equal(decoder.decode(bytes.slice(8, 12)), 'WAVE');
    assert.equal(decoder.decode(bytes.slice(36, 40)), 'data');
    assert.equal(view.getUint32(24, true), 8000);
    assert.equal(view.getUint16(22, true), 1);
    assert.equal(view.getUint16(34, true), 16);
    assert.equal(view.getUint32(40, true), bytes.length - 44);
    const pcm = [];
    for (let i = 44; i < bytes.length; i += 2) pcm.push(view.getInt16(i, true));
    assert.ok(pcm.some(n => n !== 0), sound.id);
    assert.ok(pcm.every(n => n >= -32768 && n <= 32767), sound.id);
    signatures.add(pcm.slice(500, 550).join(','));
  }
  assert.ok(signatures.size >= 9, 'soundscapes should have distinct audible patterns');
});

test('generated WAV and cues are deterministic and usable offline', () => {
  assert.deepEqual(synthesizeStudySound('brown', 0.15, 8000), synthesizeStudySound('brown', 0.15, 8000));
  for (const cue of ['start', 'pause', 'complete']) {
    const sound = synthesizeCue(cue, 8000);
    assert.ok(sound.length > 44);
    assert.equal(decoder.decode(sound.slice(0, 4)), 'RIFF');
  }
});
