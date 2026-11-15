import assert from 'node:assert/strict';
import { test } from 'node:test';
import { verifiedActivity, activityDate, activityNumber } from '../src/utils/studyActivity.ts';

const report = (days = 7) => ({ days, periodMinutes: 999, periodSessions: 99,
  daily: [{ date: '2026-10-31', minutes: 999, sessions: 99 }],
  verifiedPeriod: { minutes: 2.05, sessions: 2, daily: Array.from({ length: days }, (_, index) => ({
    date: new Date(Date.UTC(2026, 9, 1 + index)).toISOString().slice(0, 10), minutes: index === 0 ? 61 / 60 : index === 1 ? 62 / 60 : 0, sessions: index < 2 ? 1 : 0
  })) }
});

test('uses only the verified block; historical totals never fill missing data', () => {
  const stats = report();
  assert.equal(verifiedActivity(stats, 7), stats.verifiedPeriod);
  assert.equal(verifiedActivity({ ...stats, verifiedPeriod: undefined }, 7), null);
  assert.equal(verifiedActivity(stats, 30), null);
});

test('7/30 days include zeros and aggregate fractional minutes without per-session rounding', () => {
  for (const days of [7, 30]) {
    const period = verifiedActivity(report(days), days);
    assert.equal(period.daily.length, days);
    assert.equal(period.daily.filter(day => day.sessions === 0).length, days - 2);
    assert.ok(Math.abs(period.daily.reduce((total, day) => total + day.minutes, 0) - 2.05) < 1e-12);
    assert.equal(activityNumber(period.minutes / days), days === 7 ? '0.3' : '0.1');
  }
});

test('rejects stale, malformed and inconsistent periods instead of displaying misleading zeros', () => {
  for (const change of [
    stats => { stats.verifiedPeriod.minutes = -1; },
    stats => { stats.verifiedPeriod.sessions = 3; },
    stats => { stats.verifiedPeriod.minutes = NaN; },
    stats => { stats.verifiedPeriod.daily.pop(); },
    stats => { stats.verifiedPeriod.daily[1].date = stats.verifiedPeriod.daily[0].date; },
    stats => { stats.verifiedPeriod.daily[1].date = '2026-02-30'; },
    stats => { stats.verifiedPeriod.daily[0].sessions = 0.5; },
    stats => { stats.verifiedPeriod.daily[0].minutes = Infinity; }
  ]) {
    const stats = report(); change(stats);
    assert.equal(verifiedActivity(stats, 7), null);
  }
});

test('confirmed empty periods are valid and preserve the full daily series', () => {
  const stats = report();
  stats.verifiedPeriod = { minutes: 0, sessions: 0, daily: stats.verifiedPeriod.daily.map(day => ({ ...day, minutes: 0, sessions: 0 })) };
  assert.equal(verifiedActivity(stats, 7).minutes, 0);
});

test('calendar labels preserve server dates regardless of browser timezone and DST', () => {
  assert.equal(activityDate('2026-11-01'), 'Nov 1');
  assert.equal(activityDate('2026-11-01', true), 'November 1, 2026');
  assert.equal(activityNumber(0), '0');
});
