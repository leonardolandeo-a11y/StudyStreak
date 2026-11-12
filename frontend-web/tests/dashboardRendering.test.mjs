import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';
import { createElement as h } from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

const server = await createServer({ server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom' });
after(() => server.close());
const { default: Chart } = await server.ssrLoadModule('/src/components/dashboard/StudyActivityChart.tsx');
const { default: Metrics } = await server.ssrLoadModule('/src/components/dashboard/DashboardMetrics.tsx');
const { DashboardRecentContent } = await server.ssrLoadModule('/src/components/dashboard/DashboardContext.tsx');
const { default: Dashboard } = await server.ssrLoadModule('/src/pages/Dashboard.tsx');
const { AuthContext } = await server.ssrLoadModule('/src/contexts/AuthContext.ts');
const { UnreadNotificationContext } = await server.ssrLoadModule('/src/contexts/UnreadNotificationContext.ts');
const daily = Array.from({ length: 7 }, (_, i) => ({ date: `2026-11-0${i + 1}`, minutes: i === 0 ? 25 : 0, sessions: i === 0 ? 1 : 0 }));
const period = { minutes: 25, sessions: 1, daily };
const chart = props => render(h(MemoryRouter, {}, h(Chart, { days: 7, status: 'success', period, timeZone: 'America/Lima', onDaysChange() {}, onRetry() {}, ...props })));

test('activity exposes both styles, period selection and a complete accessible daily table', () => {
  const html = chart({});
  assert.match(html, /aria-label="Study period"/);
  assert.match(html, /aria-pressed="true"[^>]*>7 days/);
  assert.match(html, /aria-pressed="false"[^>]*>30 days/);
  assert.match(html, /Chart style/);
  assert.match(html, /View daily data/);
  assert.equal((html.match(/<time /g) || []).length, 7);
  assert.match(html, /November 1, 2026/);
  assert.match(html, /Historical estimates, breaks and unfinished attempts are excluded/);
});

test('loading, failure and older servers never present an invented zero', () => {
  assert.match(chart({ status: 'loading', period: null }), /role="status"/);
  assert.match(chart({ status: 'error', period: null }), /role="alert"/);
  const unsupported = chart({ period: null });
  assert.match(unsupported, /server needs the verifiedPeriod update/);
  assert.doesNotMatch(unsupported, /No verified sessions/);
});

test('refresh is an accessible icon control beside period filters with an announced loading state', () => {
  const html = chart({});
  assert.match(html, /aria-label="Refresh progress" title="Refresh progress" aria-busy="false"/);
  const loading = chart({ status: 'loading', period: null });
  assert.match(loading, /aria-label="Refresh progress" title="Refreshing progress…" aria-busy="true" disabled=""/);
});

test('confirmed empty state offers a real focus action and retains daily zero data', () => {
  const html = chart({ period: { minutes: 0, sessions: 0, daily: daily.map(day => ({ ...day, minutes: 0, sessions: 0 })) } });
  assert.match(html, /No verified sessions completed in these 7 days/);
  assert.match(html, /href="\/focus-studio"/);
  assert.equal((html.match(/<time /g) || []).length, 7);
});

test('metrics use the period daily average and preserve the distinct historical streak', () => {
  const html = render(h(Metrics, { days: 7, period, stats: { studyStreak: 12, averageMinutes: 999, periodMinutes: 9999 }, loading: false }));
  assert.match(html, />3.6 /);
  assert.match(html, />12 /);
  assert.match(html, /including historical estimates/);
  assert.match(html, /Independent of the period/);
  assert.doesNotMatch(html, /999/);
  const missing = render(h(Metrics, { days: 7, period: null, stats: null, loading: false }));
  assert.doesNotMatch(missing, />0 /);
});

test('Dashboard keeps Start focusing and notifications without the redundant navigation section', () => {
  const html = render(h(MemoryRouter, {},
    h(AuthContext.Provider, { value: { currentUser: { id: 1, username: 'Student' } } },
      h(UnreadNotificationContext.Provider, { value: { unreadCount: 2 } }, h(Dashboard)))));
  assert.match(html, /Start focusing/);
  assert.match(html, /href="\/focus-studio"/);
  assert.match(html, /Your notifications/);
  assert.equal((html.match(/aria-label="Refresh progress"/g) || []).length, 1);
  assert.doesNotMatch(html, /Keep your momentum|Dashboard quick actions|Small steps\. Lasting progress\./);
});

const recent = state => render(h(MemoryRouter, {}, h(DashboardRecentContent, {
  from: '2026-11-01', to: '2026-11-07', timeZone: 'America/Lima', state, onRetry() {}
})));

test('recent activity distinguishes loading, a confirmed empty list and a recoverable error', () => {
  assert.match(recent({ status: 'loading' }), /role="status"/);
  const empty = recent({ status: 'success', data: [] });
  assert.match(empty, /No study attempts started in this period/);
  assert.doesNotMatch(empty, /<ol|Explore sessions|role="alert"/);
  const failed = recent({ status: 'error' });
  assert.match(failed, /role="alert"/);
  assert.match(failed, /Try again/);
  assert.doesNotMatch(failed, /No study attempts/);
});

test('recent rows retain actual saved time, source, state and account-local dates', () => {
  const html = recent({ status: 'success', data: [
    { id: 'one', goal_name: 'Compression', source: 'GROUP', state: 'COMPLETE', confirmed_seconds: 1500, started_at: '2026-11-06T04:30:00Z', verified: true },
    { id: 'two', goal_name: 'Old goal', source: 'LEGACY', state: 'COMPLETE', confirmed_seconds: 600, started_at: '2026-11-04T12:00:00Z', verified: false },
    { id: 'three', goal_name: 'Attempt', source: 'INDIVIDUAL', state: 'CANCELLED', confirmed_seconds: 0, started_at: '2026-11-05T12:00:00Z', verified: true }
  ] });
  assert.equal((html.match(/<li /g) || []).length, 3);
  assert.match(html, /25 min saved/);
  assert.match(html, /Group · server observed/);
  assert.match(html, /Historical \/ unverified/);
  assert.match(html, /Cancelled/);
  assert.match(html, /Nov 5, 11:30 PM/);
  assert.match(html, /Chart uses completion dates/);
});

const { default: Insights } = await server.ssrLoadModule('/src/components/dashboard/FocusInsights.tsx');
test('relocated recorded statistics retain historical labels and share the Dashboard period without another selector', () => {
  const data = { days: 7, daily, activity: daily, byGoal: [], hourly: [], weekly: [], monthly: [],
    timeZone: 'America/Lima', totalMinutes: 95, verifiedMinutes: 75, estimatedMinutes: 20,
    completedSessions: 4, periodMinutes: 45, periodSessions: 2, weekMinutes: 45,
    activeDays: 1, studyStreak: 2, bestStudyStreak: 5, completionPercent: null };
  const html = render(h(MemoryRouter, {}, h(Insights, { data, days: 7 })));
  assert.match(html, /All-time recorded/); assert.match(html, /75 min verified · 20 min historical estimates/);
  assert.match(html, /Recorded in 7 days/); assert.match(html, /All-time completed sessions/);
  assert.match(html, /Best recorded streak/); assert.match(html, /Explore study details/);
  assert.doesNotMatch(html, /Refresh focus statistics|Study period|Verified focus|Active study days in this period/);
});
