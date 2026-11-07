import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';
import { createElement as h } from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

const server = await createServer({ server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom' });
after(() => server.close());
const { default: FocusStudio } = await server.ssrLoadModule('/src/components/dashboard/FocusStudio.tsx');
const { SoundscapeCarousel } = await server.ssrLoadModule('/src/components/focus/SoundscapeCarousel.tsx');
const { RecordedSummary } = await server.ssrLoadModule('/src/components/study/RecordedSummary.tsx');
const { SOUNDSCAPES } = await server.ssrLoadModule('/src/components/dashboard/soundscapes.ts');
const library = props => render(h(SoundscapeCarousel, {
  tracks: SOUNDSCAPES, category: 'all', onCategoryChange() {}, selected: 'dream', playing: false, async onChooseTrack() {}, ...props
}));

test('Focus Studio puts Now playing below the central timer, with side setup and final statistics', () => {
  const html = render(h(MemoryRouter, {}, h(FocusStudio, { userId: 1 })));
  const timer = html.indexOf('aria-label="Pomodoro session timer"');
  const playing = html.indexOf('aria-label="Now playing"');
  const setup = html.indexOf('aria-label="Session setup"');
  const sounds = html.indexOf('id="sound-library-heading"');
  const stats = html.indexOf('Explore your study statistics');
  assert.ok(timer >= 0 && timer < playing && playing < setup && setup < sounds && sounds < stats);
  assert.match(html, /aria-label="Study goal"/);
  assert.match(html, /aria-label="Focus settings"/);
  assert.match(html, /role="timer" aria-live="off" aria-label="25:00 remaining"/);
  assert.match(html, /focus cycles on this device/);
  assert.doesNotMatch(html, /Featured focus mix|Get in the zone/);
});

test('all original sounds have native selectable controls and labelled carousel slides', () => {
  const html = library();
  assert.equal((html.match(/data-slot="carousel-item"/g) || []).length, 12);
  for (const track of SOUNDSCAPES) assert.ok(html.includes(`Play ${track.title}, ${track.kind}`));
  assert.match(html, /aria-roledescription="carousel"/);
  assert.match(html, /aria-label="Study soundscapes"/);
  assert.match(html, /Previous slide/);
  assert.match(html, /Next slide/);
  assert.match(html, /aria-label="12 of 12"/);
});

test('category subsets do not invent tracks or replace the current playback state', () => {
  const html = library({ tracks: SOUNDSCAPES.filter(t => t.category === 'nature'), category: 'nature', selected: 'rain', playing: true });
  assert.equal((html.match(/data-slot="carousel-item"/g) || []).length, 3);
  assert.match(html, /Pause After the Rain, Soft rainfall/);
  assert.doesNotMatch(html, /Play Midnight Drift/);
  assert.match(html, /aria-pressed="true"/);
});

test('paused selected sound exposes Play while a playing selected sound exposes Pause', () => {
  assert.match(library({ selected: 'dream', playing: false }), /aria-label="Play Midnight Drift, Ambient pads"/);
  assert.match(library({ selected: 'dream', playing: true }), /aria-label="Pause Midnight Drift, Ambient pads"/);
});

test('compact recorded totals retain confirmed/unknown/error/pending semantics', () => {
  const html = render(h(RecordedSummary, { compact: true, minutes: 5, sessions: 1, pending: 2, onRefresh() {} }));
  assert.match(html, />5</);
  assert.match(html, />1</);
  assert.match(html, /2 pending on this device · excluded from totals/);
  assert.match(html, /aria-label="Refresh recorded goal totals"/);
  const unknown = render(h(RecordedSummary, { compact: true, error: true }));
  assert.match(unknown, /Totals unavailable/);
  assert.doesNotMatch(unknown, />0</);
  assert.match(render(h(RecordedSummary, { compact: true, minutes: 0, sessions: 0 })), />0</);
});
