import './helpers/appearanceTestLoader.mjs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
const { AppearanceContext } = await import('../src/contexts/AppearanceContext.ts');
const { createAppearanceStore } = await import('../src/features/appearance/appearanceStore.ts');
const { createTheme } = await import('../src/features/appearance/theme.ts');
import { controls } from './helpers/appearanceNativeMock.mjs';
import { history, router, screenOptions } from './helpers/appearanceRouterMock.mjs';
const { ActionButton } = await import('../src/components/ui/ActionButton.tsx');
const { FormField } = await import('../src/components/ui/FormField.tsx');
const { StatusMessage } = await import('../src/components/ui/StatusMessage.tsx');
const { Card } = await import('../src/components/ui/Card.tsx');
const { PageControls } = await import('../src/components/ui/PageControls.tsx');
const { SettingsLink } = await import('../src/components/navigation/SettingsLink.tsx');
const { default: Settings } = await import('../src/app/(app)/settings.tsx');
const { default: Layout } = await import('../src/app/(app)/_layout.tsx');
const { default: Home } = await import('../src/app/(app)/home.tsx');
const { default: SignIn } = await import('../src/app/sign-in.tsx');
const { default: SignUp } = await import('../src/app/sign-up.tsx');

const h = React.createElement;
function store() { return createAppearanceStore({ read: async () => null, write: async () => {} }); }
function render(component, appearance) {
  controls.clear();
  return renderToStaticMarkup(h(AppearanceContext.Provider, { value: { ...appearance.getSnapshot(),
    setPreferences: appearance.setPreferences, retryPersistence: appearance.retryPersistence } }, component));
}

test('shared UI renders semantic colors, loading, disabled/selected states and accessible fields in eight themes', async () => {
  const appearance = store();
  for (const mode of ['dark', 'light']) for (const accent of ['mint', 'blue', 'purple', 'orange']) {
    await appearance.setPreferences({ mode, accent });
    const html = render(h(Card, null,
      h(ActionButton, { title: 'Save', onPress() {}, selected: true, secondary: true }),
      h(ActionButton, { title: 'Loading action', onPress() {}, busy: true }),
      h(FormField, { label: 'Username', value: 'student', hint: 'Your public username' }),
      h(StatusMessage, { message: 'Saved', variant: 'success' }),
      h(StatusMessage, { message: 'Try again', error: true }),
      h(PageControls, { page: 0, totalPages: 2, onChange() {} })), appearance);
    assert.match(html, /aria-selected="true"/); assert.match(html, /aria-busy="true"/);
    assert.match(html, /role="alert"/); assert.match(html, /aria-label="Username"/);
    assert.match(html, /min-height:48px/); assert.match(html, /Your public username/);
    assert.equal(controls.get('Previous').disabled, true);
    assert.equal(typeof controls.get('Username').onFocus, 'function');
    assert.ok(html.includes(appearance.getSnapshot().theme.colors.errorSurface));
    assert.ok(html.includes(appearance.getSnapshot().theme.colors.primarySoft));
  }
});

test('Settings controls change the context immediately, persist appearance and show the effective motion', async () => {
  let saved;
  const appearance = createAppearanceStore({ read: async () => null, write: async value => { saved = JSON.parse(value); } });
  let html = render(h(Settings), appearance);
  assert.match(html, /Appearance/); assert.equal(controls.get('Dark').accessibilityState.selected, true);
  controls.get('Light').onPress();
  html = render(h(Settings), appearance);
  assert.equal(controls.get('Light').accessibilityState.selected, true);
  controls.get('Orange').onPress();
  html = render(h(Settings), appearance);
  assert.equal(controls.get('Orange').accessibilityState.selected, true);
  controls.get('Reduce motion').onValueChange(true);
  html = render(h(Settings), appearance);
  assert.equal(appearance.getSnapshot().reduceMotion, true);
  await appearance.retryPersistence();
  assert.deepEqual(saved, { mode: 'light', accent: 'orange', reduceMotion: true });
  controls.get('Restore default appearance').onPress();
  assert.equal(appearance.getSnapshot().preferences.mode, 'dark');
});

test('header navigates to Settings once, marks the active route and retains native Back configuration', async () => {
  history.splice(0, history.length, '/(app)/home');
  router.replace('/(app)/home');
  const appearance = store();
  render(h(SettingsLink), appearance);
  controls.get('Settings').onPress();
  const html = render(h(SettingsLink), appearance);
  assert.match(html, /aria-selected="true"/);
  assert.equal(controls.get('Settings').disabled, true);
  assert.deepEqual(history, ['/(app)/home', '/(app)/settings']);
  await appearance.setPreferences({ mode: 'light', reduceMotion: true });
  const layout = render(h(Layout), appearance);
  assert.match(layout, /data-title="Settings"/); assert.match(layout, /data-title="Goal details"/);
  assert.equal(screenOptions.at(-1).animation, 'none');
  assert.equal(screenOptions.at(-1).headerBackButtonDisplayMode, 'minimal');
  router.back(); assert.equal(history.at(-1), '/(app)/home');
  // A direct link with no previous screen still has a working Home escape.
  history.splice(0, history.length, '/(app)/settings'); router.replace('/(app)/settings');
  render(h(Layout), appearance); controls.get('Home').onPress();
  assert.equal(history.at(-1), '/(app)/home');
});

test('Login/Register keep their theme and fields; the old Home deep link now opens Menu', async () => {
  const appearance = store();
  for (const mode of ['light', 'dark']) {
    await appearance.setPreferences({ mode, accent: 'blue' });
    const expected = createTheme({ mode, accent: 'blue', reduceMotion: false }, null).colors.background;
    for (const component of [SignIn, SignUp]) {
      const html = render(h(component), appearance);
      assert.ok(html.includes(expected)); assert.match(html, /aria-label="StudyStreak"/);
      assert.match(html, /aria-label="Username"/); assert.match(html, /type="password"/);
      assert.match(html, /href="\/sign-/);
    }
  }
  assert.match(render(h(Home), appearance), /data-redirect="\/goals"/);
});

test('only one appearance provider is mounted; motion preference reaches existing decorative animations', () => {
  const root = readFileSync(new URL('../src/app/_layout.tsx', import.meta.url), 'utf8');
  assert.equal((root.match(/<AppearanceProvider>/g) ?? []).length, 1);
  assert.match(root, /<AuthProvider>/);
  const voice = readFileSync(new URL('../src/components/records/RecordVoice.tsx', import.meta.url), 'utf8');
  assert.match(voice, /!status.playing \|\| reduceMotion/);
  const resources = readFileSync(new URL('../src/app/(app)/(main)/resources/index.tsx', import.meta.url), 'utf8');
  assert.match(resources, /<CreationModal/);
  const modal = readFileSync(new URL('../src/components/ui/CreationModal.tsx', import.meta.url), 'utf8');
  assert.match(modal, /animationType=\{reduceMotion \? 'none' : 'slide'\}/);
});
