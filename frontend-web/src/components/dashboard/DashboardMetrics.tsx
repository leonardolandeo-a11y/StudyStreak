import type { ReactNode } from "react";
import { CalendarDays, CheckCheck, Clock3, Flame } from "lucide-react";
import type { FocusStatistics, VerifiedFocusPeriod } from "../../services/focusStatisticsService";
import { activityNumber } from "../../utils/studyActivity";
import type { StudyPeriod } from "../../utils/studyActivity";

function DashboardMetric({ label, value, unit, detail, icon }: { label: string; value: string; unit: string; detail: string; icon: ReactNode }) {
    return <article className="study-panel min-w-0"><div className="flex items-center justify-between gap-2"><h3 className="text-sm font-medium text-content-secondary">{label}</h3><span className="shrink-0 text-accent" aria-hidden="true">{icon}</span></div><p className="mt-3 break-words text-3xl font-semibold tracking-tight text-content tabular-nums">{value} <span className="text-sm font-normal text-content-muted">{unit}</span></p><p className="mt-2 text-xs leading-relaxed text-content-muted">{detail}</p></article>;
}

export default function DashboardMetrics({ days, stats, period, loading }: { days: StudyPeriod; stats: FocusStatistics | null; period: VerifiedFocusPeriod | null; loading: boolean }) {
    const missing = loading ? "…" : "—";
    return <section aria-label="Study statistics" aria-busy={loading} className="grid min-w-0 gap-3 sm:grid-cols-2">
        <DashboardMetric label="Verified focus" value={period ? activityNumber(period.minutes) : missing} unit="min" detail={`Confirmed time · last ${days} days`} icon={<Clock3 size={18}/>}/>
        <DashboardMetric label="Completed sessions" value={period ? activityNumber(period.sessions) : missing} unit="sessions" detail={`Verified individual & group · ${days} days`} icon={<CheckCheck size={18}/>}/>
        <DashboardMetric label="Daily average" value={period ? activityNumber(period.minutes / days) : missing} unit="min / day" detail={`Across all ${days} days, including days without activity`} icon={<CalendarDays size={18}/>}/>
        <DashboardMetric label="Current study streak" value={stats ? activityNumber(stats.studyStreak) : missing} unit="days" detail="All completed study days, including historical estimates. Independent of the period above." icon={<Flame size={18}/>}/>
    </section>;
}
