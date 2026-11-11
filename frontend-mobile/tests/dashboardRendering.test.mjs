import './helpers/appearanceTestLoader.mjs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import assert from 'node:assert/strict';
import test from 'node:test';
import { controls } from './helpers/appearanceNativeMock.mjs';
const { AppearanceContext } = await import('../src/contexts/AppearanceContext.ts');
const { createAppearanceStore } = await import('../src/features/appearance/appearanceStore.ts');
const { DashboardActivity } = await import('../src/components/dashboard/DashboardActivity.tsx');
const { ActivityPlot } = await import('../src/components/dashboard/ActivityPlot.tsx');
const h = React.createElement;
const appearance = createAppearanceStore({ read: async () => null, write: async () => {} });
const daily = Array.from({ length: 7 }, (_, index) => ({ date: `2026-11-0${index + 1}`, minutes: index === 0 ? 35 : 0, sessions: index === 0 ? 2 : 0 }));
const stats = { days: 7, timeZone: 'America/Lima', studyStreak: 4, periodMinutes: 9999, verifiedPeriod: { minutes: 35, sessions: 2, daily } };
const render = element => renderToStaticMarkup(h(AppearanceContext.Provider, { value: { ...appearance.getSnapshot(),
  setPreferences: appearance.setPreferences, retryPersistence: appearance.retryPersistence } }, element));
test('both native chart types render accessible summaries and readable axes in all theme/palette combinations', async () => {
  for (const mode of ['dark', 'light']) for (const accent of ['mint', 'blue', 'purple', 'orange']) {
    await appearance.setPreferences({ mode, accent });
    for (const style of ['bars', 'lines']) {
      const html = render(h(ActivityPlot, { period: stats.verifiedPeriod, style }));
      assert.match(html, /35 verified minutes/); assert.match(html, /Show daily values/); assert.match(html, /Nov/);
      assert.ok(html.includes(appearance.getSnapshot().theme.colors.primary));
      if (style === 'lines') assert.match(html, /rotate\(/);
    }
  }
});
test('Dashboard metrics preserve Web meanings and never render legacy totals as verified', () => {
  const html = render(h(DashboardActivity, { days: 7, onDaysChange() {}, retry() {}, state: { status: 'success', data: stats } }));
  for (const label of ['Verified focus', 'Completed sessions', 'Daily average', 'Current study streak']) assert.ok(html.includes(label));
  assert.match(html, /All completed study days, including historical estimates/);
  assert.match(html, /Across all 7 days, including days without activity/);
  assert.doesNotMatch(html, /9999/);
});
test('loading, empty, error and missing verified contract remain distinct with retry', () => {
  const common = { days: 7, onDaysChange() {}, retry() {} };
  assert.match(render(h(DashboardActivity, { ...common, state: { status: 'loading' } })), /Loading verified activity/);
  assert.match(render(h(DashboardActivity, { ...common, state: { status: 'error' } })), /Retry activity/);
  assert.match(render(h(DashboardActivity, { ...common, state: { status: 'success', data: { ...stats, verifiedPeriod: undefined } } })), /unavailable or inconsistent/);
  const empty = { ...stats, verifiedPeriod: { minutes: 0, sessions: 0, daily: daily.map(day => ({ ...day, minutes: 0, sessions: 0 })) } };
  assert.match(render(h(DashboardActivity, { ...common, state: { status: 'success', data: empty } })), /No verified study time/);
});

const { FocusInsightsMobile } = await import('../src/components/focus/FocusInsightsMobile.tsx');
test('recorded insights consume the Dashboard snapshot and keep estimates distinct from verified metrics', () => {
  controls.clear();
  const html = render(h(FocusInsightsMobile, { days: 7, data: { ...stats, totalMinutes: 95,
    verifiedMinutes: 75, estimatedMinutes: 20, weekMinutes: 45, completedSessions: 4, periodMinutes: 45, periodSessions: 2 } }));
  assert.match(html, /All-time recorded/); assert.match(html, /75 min verified · 20 min historical estimates/);
  assert.match(html, /Recorded in 7 days/); assert.match(html, /All-time completed sessions/);
  assert.match(html, /Explore study details/);
  assert.equal(controls.get('Explore study details')['aria-expanded'],false);
  assert.equal(controls.get('Explore study details').accessibilityState.expanded,false);
  assert.doesNotMatch(html, /Retry statistics|Verified focus|Verified sessions/);
  assert.equal(controls.has('7 days'),false); assert.equal(controls.has('30 days'),false);
});
