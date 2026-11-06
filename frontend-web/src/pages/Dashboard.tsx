import { useCallback, useState } from "react";
import { ArrowRight, Bell, Timer } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useUnreadNotifications } from "../hooks/useUnreadNotifications";
import { useDashboardResource } from "../hooks/useDashboardResource";
import { ROUTES } from "../routes/paths";
import { fetchFocusStatistics } from "../services/focusStatisticsService";
import { verifiedActivity } from "../utils/studyActivity";
import type { StudyPeriod } from "../utils/studyActivity";
import StudyActivityChart from "../components/dashboard/StudyActivityChart";
import DashboardMetrics from "../components/dashboard/DashboardMetrics";
import { DashboardGoals, DashboardRecent } from "../components/dashboard/DashboardContext";

function DashboardActivity({ days, onDaysChange, userId }: { days: StudyPeriod; onDaysChange: (days: StudyPeriod) => void; userId: number }) {
    const load = useCallback((signal: AbortSignal) => fetchFocusStatistics(days, signal), [days]);
    const { state, retry } = useDashboardResource(load);
    const stats = state.status === "success" ? state.data : null;
    const period = stats ? verifiedActivity(stats, days) : null;
    const from = stats?.daily[0]?.date, to = stats?.daily.at(-1)?.date;
    return <>
        <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
            <StudyActivityChart days={days} onDaysChange={onDaysChange} status={state.status} period={period} timeZone={stats?.timeZone} onRetry={retry}/>
            <DashboardMetrics days={days} stats={stats} period={period} loading={state.status === "loading"}/>
        </div>
        <div className="grid min-w-0 items-start gap-4 lg:grid-cols-2">
            <DashboardGoals userId={userId}/>
            {from && to && stats ? <DashboardRecent key={`${from}-${to}`} from={from} to={to} timeZone={stats.timeZone}/> : <section className="study-panel p-4 text-sm text-content-muted sm:p-5" aria-label="Recent study activity">{state.status === "loading" ? "Loading your study period…" : "Reload study activity to view recent attempts."}</section>}
        </div>
    </>;
}

function DashboardContent({ userId, username }: { userId: number; username: string }) {
    const [days, setDays] = useState<StudyPeriod>(7);
    const { unreadCount } = useUnreadNotifications();
    return <div className="min-w-0 space-y-4">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div className="min-w-0"><p className="study-kicker">Your study space</p><h1 className="mt-2 break-words text-2xl font-semibold tracking-tight text-content sm:text-3xl">Welcome back, {username}</h1></div><Link to={ROUTES.focusStudio} className="study-button w-fit shrink-0 border-accent bg-accent text-on-accent hover:bg-accent-hover"><Timer size={18} aria-hidden="true"/>Start focusing <ArrowRight size={16} aria-hidden="true"/></Link></header>
        <DashboardActivity days={days} onDaysChange={setDays} userId={userId}/>
        <Link to={ROUTES.notifications} className="flex min-h-11 flex-wrap items-center justify-between gap-3 rounded-control border border-outline px-4 py-3 text-sm text-content-secondary hover:bg-surface-hover"><span className="flex items-center gap-2"><Bell size={16} className="text-accent" aria-hidden="true"/>Your notifications</span><span className="text-content-muted">{unreadCount} unread <span aria-hidden="true">→</span></span></Link>
    </div>;
}

export default function Dashboard() {
    const { currentUser } = useAuth();
    return currentUser ? <DashboardContent key={currentUser.id} userId={currentUser.id} username={currentUser.username}/> : null;
}
