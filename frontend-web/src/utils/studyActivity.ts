import type { FocusStatistics, VerifiedFocusPeriod } from "../services/focusStatisticsService";

export type StudyPeriod = 7 | 30;

/** Reject mixed/stale reports; historical daily/periodMinutes are never a fallback. */
export function verifiedActivity(stats: FocusStatistics, days: StudyPeriod): VerifiedFocusPeriod | null {
    const period = stats.verifiedPeriod;
    if (stats.days !== days || !period || !Array.isArray(period.daily) || period.daily.length !== days) return null;
    const finite = (value: number) => Number.isFinite(value) && value >= 0;
    const count = (value: number) => Number.isSafeInteger(value) && value >= 0;
    if (!finite(period.minutes) || !count(period.sessions)) return null;
    let seconds = 0, sessions = 0, previous = 0;
    for (const day of period.daily) {
        const date = Date.parse(`${day.date}T00:00:00Z`);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(day.date) || !Number.isFinite(date)
            || new Date(date).toISOString().slice(0, 10) !== day.date
            || (previous !== 0 && date - previous !== 86400000)
            || !finite(day.minutes) || !count(day.sessions)) return null;
        seconds += day.minutes * 60;
        sessions += day.sessions;
        previous = date;
    }
    return Math.abs(seconds / 60 - period.minutes) <= 1e-8 * Math.max(1, period.minutes)
        && sessions === period.sessions ? period : null;
}

export const activityNumber = (value: number) => new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(value);

/** Server dates are calendar buckets, never timestamps in the browser's timezone. */
export function activityDate(date: string, long = false): string {
    return new Intl.DateTimeFormat("en", {
        month: long ? "long" : "short", day: "numeric", ...(long ? { year: "numeric" } as const : {}), timeZone: "UTC"
    }).format(new Date(`${date}T12:00:00Z`));
}
