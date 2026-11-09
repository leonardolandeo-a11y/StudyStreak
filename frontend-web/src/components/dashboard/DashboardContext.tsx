import { AcademicEmpty, PixelGlyph } from "../academic/Academic";
import { useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useDashboardResource } from "../../hooks/useDashboardResource";
import type { DashboardResource } from "../../hooks/useDashboardResource";
import { getAllActiveGoals } from "../../services/activeGoalsService";
import { getRecentStudySessions } from "../../services/dashboardActivityService";
import type { DashboardSession } from "../../services/dashboardActivityService";
import { dailyRecordsPath, goalDetailsPath, ROUTES } from "../../routes/paths";
import { activityDate, activityNumber } from "../../utils/studyActivity";
import LoadingState from "../ui/LoadingState";
import ErrorMessage from "../ui/ErrorMessage";

function Retry({ onRetry }: { onRetry: () => void }) {
    return <button type="button" className="study-button mt-3" onClick={onRetry}>Try again</button>;
}

export function DashboardGoals({ userId }: { userId: number }) {
    const load = useCallback((signal: AbortSignal) => getAllActiveGoals(userId, signal), [userId]);
    const { state, retry } = useDashboardResource(load);
    return <section className="study-panel min-w-0 p-4 sm:p-5" aria-labelledby="dashboard-goals-heading"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 id="dashboard-goals-heading" className="text-lg font-semibold text-content">Your active goals</h2><Link to={ROUTES.goals} className="study-button">All goals <ArrowUpRight size={16} aria-hidden="true"/></Link></div>
        {state.status === "loading" ? <LoadingState message="Loading your goals…"/>
        : state.status === "error" ? <><ErrorMessage message="Your goals could not be loaded."/><Retry onRetry={retry}/></>
        : state.data.length === 0 ? <><AcademicEmpty><p>Create your first study goal.</p></AcademicEmpty><Link className="study-button mt-3" to={ROUTES.goals}>Create a goal</Link></>
        : <><ul className="space-y-3">{state.data.slice(0, 3).map(goal => <li key={goal.id} className="rounded-control border border-outline p-4"><Link to={goalDetailsPath(goal.id)} className="flex items-start gap-2 break-words font-semibold text-content hover:text-accent"><PixelGlyph name="book" size={20} /><span className="min-w-0">{goal.topic}</span></Link><p className="mt-1 text-xs text-content-muted">Target: {goal.frequency} times / week · {goal.duration} min / session</p><Link className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-accent" to={dailyRecordsPath(goal.id)}>Study records <ArrowUpRight size={14} aria-hidden="true"/></Link></li>)}</ul><p className="mt-3 text-xs leading-relaxed text-content-muted">{state.data.length} active {state.data.length === 1 ? "goal" : "goals"}. Targets are your plan; confirmed session time appears above.</p></>}
    </section>;
}

interface RecentProps {
    from: string;
    to: string;
    timeZone: string;
}

export function DashboardRecent({ from, to, timeZone }: RecentProps) {
    const load = useCallback((signal: AbortSignal) => getRecentStudySessions(from, to, signal), [from, to]);
    const { state, retry } = useDashboardResource(load);
    return <DashboardRecentContent from={from} to={to} timeZone={timeZone} state={state} onRetry={retry}/>;
}

export function DashboardRecentContent({ from, to, timeZone, state, onRetry }: RecentProps & {
    state: DashboardResource<DashboardSession[]>;
    onRetry: () => void;
}) {
    return <section className="study-panel min-w-0 p-4 sm:p-5" aria-labelledby="dashboard-recent-heading">
        <h2 id="dashboard-recent-heading" className="text-lg font-semibold text-content">Recent study activity</h2>
        <p className="mt-1 mb-3 text-xs leading-relaxed text-content-muted">Started {activityDate(from)} – {activityDate(to)} · {timeZone}. Chart uses completion dates.</p>
        {state.status === "loading" ? <LoadingState message="Loading recent activity…"/>
        : state.status === "error" ? <><ErrorMessage message="Recent activity could not be loaded."/><Retry onRetry={onRetry}/></>
        : state.data.length === 0 ? <AcademicEmpty><p>No study attempts started in this period.</p></AcademicEmpty>
        : <>
            <ol className="divide-y divide-outline">
                {state.data.map(session => <li key={session.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="min-w-0 flex-1 break-words text-sm font-semibold text-content">{session.goal_name}</h3>
                        <span className="rounded-control bg-surface-hover px-2 py-1 text-xs text-content-secondary">{session.state === "COMPLETE" ? "Complete" : session.state === "CANCELLED" ? "Cancelled" : session.state === "PAUSED" ? "Paused" : "Running"}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-content-muted">
                        <span className="text-content-secondary">{activityNumber(session.confirmed_seconds / 60)} min saved</span>
                        <span>{session.source === "LEGACY" || !session.verified ? "Historical / unverified" : session.source === "GROUP" ? "Group · server observed" : "Individual · server observed"}</span>
                        <time dateTime={session.started_at}>{new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone }).format(new Date(session.started_at))}</time>
                    </div>
                </li>)}
            </ol>
            <Link to={ROUTES.focusStudio} className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-accent">Explore sessions in Focus Studio <ArrowUpRight size={16} aria-hidden="true"/></Link>
        </>}
    </section>;
}
