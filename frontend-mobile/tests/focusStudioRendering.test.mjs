import './helpers/appearanceTestLoader.mjs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import assert from 'node:assert/strict';
import test from 'node:test';
const { AppearanceContext } = await import('../src/contexts/AppearanceContext.ts');
const { createAppearanceStore } = await import('../src/features/appearance/appearanceStore.ts');
const { FocusTimerPanel } = await import('../src/components/focus/FocusTimerPanel.tsx');
const { FocusSoundCarousel } = await import('../src/components/focus/FocusSoundCarousel.tsx');
const { FocusSettingsDialog } = await import('../src/components/focus/FocusSettingsDialog.tsx');
const { DEFAULT_PREFERENCES } = await import('../src/features/focus/pomodoroState.ts');
const { SOUNDSCAPES } = await import('../src/features/focus/soundscapes.ts');
import { controls } from './helpers/appearanceNativeMock.mjs';
const h = React.createElement;
const appearance = createAppearanceStore({ read: async () => null, write: async () => {} });
const render = element => renderToStaticMarkup(h(AppearanceContext.Provider, { value: { ...appearance.getSnapshot(), setPreferences: appearance.setPreferences, retryPersistence: appearance.retryPersistence } }, element));
const props = { mode: 'focus', time: '25:00', progress: .25, running: false, paused: false, ready: true, locked: false, busy: false, onMode() {}, onToggle() {}, onReset() {}, onSettings() {} };
test('timer, carousel and settings render in all eight global appearances without changing sound identities', async () => {
  for (const mode of ['dark', 'light']) for (const accent of ['mint', 'blue', 'purple', 'orange']) {
    await appearance.setPreferences({ mode, accent });
    const timer = render(h(FocusTimerPanel, props)); assert.match(timer, /Time remaining 25:00/); assert.match(timer, /Session progress/);
    const carousel = render(h(FocusSoundCarousel, { selected: 'dream', playing: false, loading: false, ready: true, onChoose() {} }));
    for (const track of SOUNDSCAPES) assert.ok(carousel.includes(track.title));
    assert.doesNotMatch(timer, /study-environment|Study ambience|study-scene/);
    assert.match(timer, /pomodoro-circle/);
    assert.equal(SOUNDSCAPES.length, 12); assert.ok(timer.includes(appearance.getSnapshot().theme.colors.primary));
  }
});
test('controls reflect actual running/paused state and keep phase/duration locked for linked paused sessions', () => {
  assert.match(render(h(FocusTimerPanel, { ...props, running: true })), /Pause timer/);
  assert.match(render(h(FocusTimerPanel, { ...props, paused: true, locked: true })), /Resume session/);
  assert.equal(controls.get('Short break').disabled, true);
  render(h(FocusSettingsDialog, { preferences: DEFAULT_PREFERENCES, locked: true, onSave() {}, onClose() {} }));
  assert.equal(controls.get('Increase Focus').disabled, true); assert.equal(controls.get('Increase Long break').disabled, true);
  assert.equal(controls.get('Save Focus settings').disabled, false);
});
