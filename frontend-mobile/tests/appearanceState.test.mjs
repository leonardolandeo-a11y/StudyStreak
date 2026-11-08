import './helpers/appearanceTestLoader.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
const { createAppearanceStore } = await import('../src/features/appearance/appearanceStore.ts');
const { createTheme, defaultAppearance, parseAppearance } = await import('../src/features/appearance/theme.ts');
const { appearanceStorage } = await import('../src/services/appearanceStorage.ts');
import { files } from './helpers/appearanceFileSystemMock.mjs';

const tick = () => new Promise(resolve => setImmediate(resolve));
function environment() {
  let schemeListener;
  let motionListener;
  return {
    getScheme: () => 'dark', getReducedMotion: async () => false,
    onSchemeChange(listener) { schemeListener = listener; return () => { schemeListener = null; }; },
    onMotionChange(listener) { motionListener = listener; return () => { motionListener = null; }; },
    scheme(value) { schemeListener?.(value); }, motion(value) { motionListener?.(value); },
  };
}
test('missing, malformed and unsupported preferences use safe field defaults', () => {
  for (const input of [null, '', 'broken', 'null', '[]', '{"mode":"retro","accent":"red","reduceMotion":"false"}']) {
    assert.deepEqual(parseAppearance(input), defaultAppearance);
  }
  assert.deepEqual(parseAppearance('{"mode":"light","accent":"blue","reduceMotion":true,"token":"discard"}'),
    { mode: 'light', accent: 'blue', reduceMotion: true });
});
test('all palettes preserve readable semantic text, accents and independent error/success colors', () => {
  function luminance(hex) {
    const channels = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255)
      .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
    return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
  }
  const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05);
  for (const mode of ['dark', 'light']) for (const accent of ['mint', 'blue', 'purple', 'orange']) {
    const { colors } = createTheme({ mode, accent, reduceMotion: false }, null);
    for (const [text, background] of [[colors.text, colors.background], [colors.muted, colors.surface],
      [colors.primaryText, colors.primary], [colors.primary, colors.primarySoft],
      [colors.error, colors.errorSurface], [colors.success, colors.successSurface]]) assert.ok(contrast(text, background) >= 4.5);
    assert.equal(colors.error, createTheme({ ...defaultAppearance, mode }, null).colors.error);
  }
});
test('native preference file survives a new store without touching study or token keys', async () => {
  files.clear(); files.set('test://documents/study-outbox-v3/existing.json', 'unchanged');
  const first = createAppearanceStore(appearanceStorage);
  const stop = first.connect(environment()); await tick();
  await first.setPreferences({ mode: 'light', accent: 'purple', reduceMotion: true }); stop();
  const second = createAppearanceStore(appearanceStorage);
  const disconnect = second.connect(environment()); await tick();
  assert.deepEqual(second.getSnapshot().preferences, { mode: 'light', accent: 'purple', reduceMotion: true });
  assert.equal(files.get('test://documents/study-outbox-v3/existing.json'), 'unchanged');
  assert.deepEqual(JSON.parse(files.get('test://documents/appearance/preferences-v1.json')), second.getSnapshot().preferences);
  disconnect();
});
test('System follows changes, manual themes remain fixed and listeners stop on disconnect', async () => {
  const store = createAppearanceStore({ read: async () => null, write: async () => {} });
  const events = environment(); const stop = store.connect(events); await tick();
  await store.setPreferences({ mode: 'system' });
  events.scheme('light'); assert.equal(store.getSnapshot().theme.mode, 'light');
  events.scheme('dark'); assert.equal(store.getSnapshot().theme.mode, 'dark');
  await store.setPreferences({ mode: 'light' });
  events.scheme('dark'); assert.equal(store.getSnapshot().theme.mode, 'light');
  await store.setPreferences({ mode: 'system' });
  stop(); events.scheme('light'); assert.equal(store.getSnapshot().theme.mode, 'dark');
});
test('device reduced motion cannot be disabled by the local switch, including an initial query race', async () => {
  let finish;
  const events = environment(); events.getReducedMotion = () => new Promise(resolve => { finish = resolve; });
  const store = createAppearanceStore({ read: async () => null, write: async () => {} });
  const stop = store.connect(events);
  events.motion(true); finish(false); await tick();
  await store.setPreferences({ reduceMotion: false }); assert.equal(store.getSnapshot().reduceMotion, true);
  events.motion(false); assert.equal(store.getSnapshot().reduceMotion, false);
  await store.setPreferences({ reduceMotion: true }); assert.equal(store.getSnapshot().reduceMotion, true);
  stop();
});
test('hydration cannot overwrite a newer choice; rapid writes persist in order', async () => {
  let finish;
  const writes = [];
  const store = createAppearanceStore({ read: () => new Promise(resolve => { finish = resolve; }),
    write: async value => { writes.push(JSON.parse(value)); } });
  const stop = store.connect(environment());
  const changes = [store.setPreferences({ mode: 'light' }), store.setPreferences({ accent: 'orange' })];
  finish(JSON.stringify(defaultAppearance)); await Promise.all(changes); await tick();
  assert.equal(store.getSnapshot().theme.mode, 'light');
  assert.deepEqual(writes.at(-1), { mode: 'light', accent: 'orange', reduceMotion: false }); stop();
});
test('read/write failures leave the UI usable and retry persists the latest choice', async () => {
  let fail = true; let saved;
  const store = createAppearanceStore({ read: async () => { throw new Error('Fixture read failure'); },
    write: async value => { if (fail) throw new Error('Fixture disk full'); saved = value; } });
  const stop = store.connect(environment()); await tick();
  assert.equal(store.getSnapshot().ready, true); assert.ok(store.getSnapshot().persistenceError);
  await store.setPreferences({ accent: 'blue' }); assert.equal(store.getSnapshot().preferences.accent, 'blue');
  assert.ok(store.getSnapshot().persistenceError);
  fail = false; await store.retryPersistence();
  assert.equal(store.getSnapshot().persistenceError, null); assert.equal(JSON.parse(saved).accent, 'blue'); stop();
});
