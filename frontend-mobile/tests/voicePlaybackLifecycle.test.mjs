import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const source = readFileSync(join(process.cwd(), 'src/components/records/RecordVoice.tsx'), 'utf8');

test('voice player mounts with a downloaded local source, not a replaced empty source', () => {
  assert.match(source, /useAudioPlayer\(uri\)/);
  assert.match(source, /<VoicePlayback key=\{uri\} uri=\{uri\}/);
  assert.doesNotMatch(source, /player\.replace\(/);
});

test('voice file is checked before mounting the native player', () => {
  assert.match(source, /verifyM4a\(downloaded\)/);
  assert.match(source, /FileMode\.ReadOnly/);
  assert.match(source, /header\[4\] !== 102/);
  assert.match(source, /setUri\(downloaded\.uri\)/);
});

test('voice player reports decode and stalled-load failures and offers retry', () => {
  assert.match(source, /status\.error/);
  assert.match(source, /setLoadTimedOut\(true\)/);
  assert.match(source, /Retry voice playback/);
});

test('voice cache remains private and is removed on screen blur', () => {
  assert.match(source, /useFocusEffect\(/);
  assert.match(source, /if \(file\.exists\) file\.delete\(\)/);
  assert.match(source, /active = false;/);
  assert.match(source, /cleanUp\(localFile\)/);
});
