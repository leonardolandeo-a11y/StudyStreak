import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';

// Render the production TSX through Vite, using the same React instance as SSR.
const server = await createServer({ server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom' });
after(() => server.close());
const { createElement: h } = await import('react');
const { renderToStaticMarkup: render } = await import('react-dom/server');
const { RecordedSummary } = await server.ssrLoadModule('/src/components/study/RecordedSummary.tsx');
const { ParticipantCard } = await server.ssrLoadModule('/src/components/study/ParticipantCard.tsx');
const { BarChart } = await server.ssrLoadModule('/src/components/study/BarChart.tsx');
const { default: DailyRecordForm } = await server.ssrLoadModule('/src/components/dailyRecords/DailyRecordForm.tsx');

test('failed refresh keeps the last confirmed totals, with a stale warning and separate pending count', () => {
  const html = render(h(RecordedSummary, { minutes: 125, sessions: 5, pending: 1, error: true }));
  assert.match(html, />125</);
  assert.match(html, />5</);
  assert.match(html, /Update failed · showing last confirmed totals/);
  assert.match(html, /1 pending on this device · excluded from totals/);
  assert.doesNotMatch(html, />126</);
});

test('missing recorded data is unknown, while a confirmed zero stays zero', () => {
  assert.match(render(h(RecordedSummary, { error: true })), /Totals unavailable/);
  assert.doesNotMatch(render(h(RecordedSummary, {})), />0</);
  assert.match(render(h(RecordedSummary, { minutes: 0, sessions: 0 })), />0</);
});

test('online presence alone never marks a participant as studying', () => {
  const html = render(h(ParticipantCard, { name: 'Student', online: true, studying: false, host: false }));
  assert.match(html, /Member · Online/);
  assert.match(html, /Not studying/);
  assert.doesNotMatch(html, />Studying</);
  const offline = render(h(ParticipantCard, { name: 'Host', online: false, studying: true, host: true }));
  assert.match(offline, /Host · Offline/);
  assert.match(offline, /Study status paused · offline/);
});

test('empty and zero charts expose accessible data without artificial bar heights', () => {
  assert.match(render(h(BarChart, { label: 'Daily', items: [] })), /No recorded time/);
  const html = render(h(BarChart, { label: 'Daily', items: [{ label: '2026-11-05', value: 0 }] }));
  assert.match(html, /aria-label="2026-11-05: 0.0 min"/);
  assert.match(html, /height:0%/);
  assert.doesNotMatch(html, /NaN|Infinity/);
});

test('daily record date remains informational on create and edit', () => {
  const props = { loading: false, onSubmit: async () => true };
  const create = render(h(DailyRecordForm, props));
  assert.match(create, /La fecha se asignará automáticamente al guardar según la zona horaria de tu cuenta/);
  const edit = render(h(DailyRecordForm, { ...props, initialValues: { date: '2026-11-04', note: '', evidence: '' } }));
  assert.match(edit, /Original date: 2026-11-04/);
  assert.doesNotMatch(create + edit, /type="date"|name="date"|id="date"/);
});
