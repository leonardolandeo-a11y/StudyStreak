import type { FocusStatistics } from '../focus/focusStatisticsService';
export type StudyPeriod = 7 | 30;
export type VerifiedPeriod = NonNullable<FocusStatistics['verifiedPeriod']>;

// Same contract/tolerance as Web: never fall back to legacy period/daily/history.
export function verifiedActivity(stats: FocusStatistics, days: StudyPeriod): VerifiedPeriod | null {
  const period = stats?.verifiedPeriod;
  if (stats?.days !== days || !period || !Array.isArray(period.daily) || period.daily.length !== days) return null;
  const finite = (value: number) => typeof value === 'number' && Number.isFinite(value) && value >= 0;
  const count = (value: number) => Number.isSafeInteger(value) && value >= 0;
  if (!finite(period.minutes) || !count(period.sessions)) return null;
  let seconds = 0, sessions = 0, previous = 0;
  for (const day of period.daily) {
    if (!day || typeof day.date !== 'string') return null;
    const date = Date.parse(`${day.date}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day.date) || !Number.isFinite(date) || new Date(date).toISOString().slice(0, 10) !== day.date ||
      (previous !== 0 && date - previous !== 86400000) || !finite(day.minutes) || !count(day.sessions)) return null;
    seconds += day.minutes * 60; sessions += day.sessions; previous = date;
  }
  return Math.abs(seconds / 60 - period.minutes) <= 1e-8 * Math.max(1, period.minutes) && sessions === period.sessions ? period : null;
}
export const activityNumber = (value: number) => new Intl.NumberFormat('en', { maximumFractionDigits: 1 }).format(value);
export const activityDate = (date: string) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', timeZone: 'UTC' })
  .format(new Date(`${date}T12:00:00Z`));

export function chartGeometry(minutes: number[], width: number, height: number) {
  const maximum = Math.max(1, ...minutes);
  const power = 10 ** Math.floor(Math.log10(maximum));
  const top = Math.ceil(maximum / power) * power;
  const step = width / minutes.length;
  const points = minutes.map((value, index) => ({ x: step * (index + .5), y: height * (1 - value / top) }));
  const segments = points.slice(1).map((end, index) => {
    const start = points[index], dx = end.x - start.x, dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    return { left: (start.x + end.x) / 2 - length / 2, top: (start.y + end.y) / 2 - 1,
      length, angle: Math.atan2(dy, dx) * 180 / Math.PI };
  });
  return { top, step, points, segments };
}
