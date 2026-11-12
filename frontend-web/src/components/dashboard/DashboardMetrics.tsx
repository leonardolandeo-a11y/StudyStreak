import { AcademicSprite, type AcademicSpriteName } from "../academic/AcademicSprite";
import type { FocusStatistics, VerifiedFocusPeriod } from "../../services/focusStatisticsService";
import { activityNumber } from "../../utils/studyActivity";
import type { StudyPeriod } from "../../utils/studyActivity";

function DashboardMetric({ label, value, unit, detail, icon }: { label: string; value: string; unit: string; detail: string; icon: AcademicSpriteName }) {
    return <article className={`study-panel academic-metric retro-stat retro-stat-${icon} min-w-0`}>
        <AcademicSprite name={icon} width={48}/><div className="min-w-0"><h3 className="text-sm font-semibold text-content">{label}</h3><p className="mt-1 break-words text-3xl font-bold text-content tabular-nums">{value} <span className="text-sm font-normal text-content-secondary">{unit}</span></p><p className="mt-2 text-xs leading-relaxed text-content-secondary">{detail}</p></div>
    </article>;
}

export default function DashboardMetrics({ days, stats, period, loading }: { days: StudyPeriod; stats: FocusStatistics | null; period: VerifiedFocusPeriod | null; loading: boolean }) {
    const missing = loading ? "…" : "—";
    return <section aria-label="Study statistics" aria-busy={loading} className="grid min-w-0 gap-3 sm:grid-cols-2">
        <DashboardMetric label="Verified focus" value={period ? activityNumber(period.minutes) : missing} unit="min" detail={`Confirmed time · last ${days} days`} icon="stopwatch"/>
        <DashboardMetric label="Completed sessions" value={period ? activityNumber(period.sessions) : missing} unit="sessions" detail={`Verified individual & group · ${days} days`} icon="notebook"/>
        <DashboardMetric label="Daily average" value={period ? activityNumber(period.minutes / days) : missing} unit="min / day" detail={`Across all ${days} days, including days without activity`} icon="growth"/>
        <DashboardMetric label="Current study streak" value={stats ? activityNumber(stats.studyStreak) : missing} unit="days" detail="All completed study days, including historical estimates. Independent of the period above." icon="flame"/>
    </section>;
}
