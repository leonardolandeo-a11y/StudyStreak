import './helpers/appearanceTestLoader.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
const { verifiedActivity, chartGeometry } = await import('../src/features/dashboard/verifiedActivity.ts');
function stats(days = 7) {
  const daily = Array.from({ length: days }, (_, index) => ({ date: new Date(Date.UTC(2026, 10, index + 1)).toISOString().slice(0, 10),
    minutes: index === 1 ? 12.5 : 0, sessions: index === 1 ? 1 : 0 }));
  return { days, studyStreak: 3, timeZone: 'America/Lima', verifiedPeriod: { minutes: 12.5, sessions: 1, daily },
    periodMinutes: 9999, totalMinutes: 88888, daily: daily.map(day => ({ ...day, minutes: 999 })) };
}
test('uses only verifiedPeriod, preserves fractional minutes and includes zero days in both windows', () => {
  for (const days of [7, 30]) {
    const value = stats(days);
    assert.equal(verifiedActivity(value, days), value.verifiedPeriod);
    assert.equal(verifiedActivity(value, days).minutes / days, 12.5 / days);
    delete value.verifiedPeriod;
    assert.equal(verifiedActivity(value, days), null);
  }
});
test('rejects wrong periods, missing days, invalid dates, negative/nonfinite data and inconsistent totals', () => {
  const mutations = [
    value => { value.days = 30; }, value => { value.verifiedPeriod.daily.pop(); },
    value => { value.verifiedPeriod.daily[1].date = '2026-02-30'; },
    value => { value.verifiedPeriod.daily[1].date = value.verifiedPeriod.daily[0].date; },
    value => { value.verifiedPeriod.minutes = Infinity; }, value => { value.verifiedPeriod.daily[0].minutes = -1; },
    value => { value.verifiedPeriod.daily[0].sessions = 0.5; }, value => { value.verifiedPeriod.sessions = 99; },
    value => { value.verifiedPeriod.minutes = 14; }, value => { value.verifiedPeriod.daily[0] = null; },
  ];
  for (const change of mutations) { const value = stats(); change(value); assert.equal(verifiedActivity(value, 7), null); }
});
test('an entirely verified zero period is valid; floating point summation tolerance matches Web', () => {
  const value = stats(); value.verifiedPeriod.daily.forEach(day => { day.minutes = 0; day.sessions = 0; });
  value.verifiedPeriod.minutes = 0; value.verifiedPeriod.sessions = 0;
  assert.equal(verifiedActivity(value, 7).minutes, 0);
  value.verifiedPeriod.daily[0].minutes = .1; value.verifiedPeriod.daily[1].minutes = .2;
  value.verifiedPeriod.minutes = .3; assert.ok(verifiedActivity(value, 7));
});
test('native bar/line geometry has matching positions, correct segment endpoints and a nonzero empty scale', () => {
  const graph = chartGeometry([0, 15, 30], 300, 160);
  assert.deepEqual(graph.points, [{ x: 50, y: 160 }, { x: 150, y: 80 }, { x: 250, y: 0 }]);
  for (const [index, segment] of graph.segments.entries()) {
    const center = { x: segment.left + segment.length / 2, y: segment.top + 1 };
    const angle = segment.angle * Math.PI / 180;
    assert.ok(Math.abs(center.x - Math.cos(angle) * segment.length / 2 - graph.points[index].x) < 1e-8);
    assert.ok(Math.abs(center.y - Math.sin(angle) * segment.length / 2 - graph.points[index].y) < 1e-8);
  }
  assert.equal(chartGeometry([0, 0], 200, 160).top, 1);
});
