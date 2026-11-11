import StudyAnalyticsDetails from "./StudyAnalyticsDetails";
import { MetricCard } from "../study/MetricCard";
import { focusDuration, type FocusStatistics } from "../../services/focusStatisticsService";

/** Uses the Dashboard snapshot and period; never fetches a second statistics copy. */
export default function FocusInsights({ data, days }: { data: FocusStatistics; days: 7 | 30 }) {
    return <section aria-label="Recorded study statistics" className="study-panel p-4 sm:p-5">
        <p className="study-kicker">Your study journey</p>
        <h2 className="mt-2 text-xl font-semibold text-content">Time well spent.</h2>
        <p className="mt-2 text-sm text-content-muted">Saved sessions across Web and Mobile · {data.timeZone}. Recorded totals include labelled historical estimates; pending time is excluded.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="All-time recorded" value={focusDuration(data.totalMinutes)} detail={`${data.verifiedMinutes} min verified · ${data.estimatedMinutes} min historical estimates`}/>
            <MetricCard label="All-time completed sessions" value={data.completedSessions} detail="Across all Goals · recorded sessions"/>
            <MetricCard label={`Recorded in ${days} days`} value={focusDuration(data.periodMinutes)} detail={`${data.periodSessions} sessions · includes historical estimates`}/>
            <MetricCard label="This week" value={focusDuration(data.weekMinutes)} detail="Monday through today · recorded time"/>
        </div>
        <details className="mt-4" aria-label="Detailed study statistics">
            <summary className="min-h-11 cursor-pointer rounded-control py-3 font-semibold text-accent">Explore study details</summary>
            <StudyAnalyticsDetails key={days} data={data}/>
        </details>
    </section>;
}
