/** Presentation only. Totals and calendar buckets always come from the API. */
export function barPercent(value: number, maximum: number): number {
  return !Number.isFinite(value) || !Number.isFinite(maximum) || maximum <= 0 ? 0 : Math.min(100, Math.max(0, value / maximum * 100));
}
export function activityColor(minutes: number): string {
  return minutes <= 0 ? 'var(--ss-chart-empty)' : minutes < 30 ? 'var(--ss-chart-low)' : minutes < 60 ? 'var(--ss-chart-medium)' : 'var(--ss-accent)';
}
export function calendarPadding(firstDate?: string): number {
  return firstDate ? (new Date(`${firstDate}T12:00:00Z`).getUTCDay() + 6) % 7 : 0;
}
export function sessionDate(value: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en', { timeZone, month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}
