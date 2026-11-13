import { RecordedCalendar } from '../components/dashboard/RecordedCalendar';
import '../components/dashboard/cozy-dashboard.css';
import { StudyEnvironment } from '../components/environment/StudyEnvironment';
import { useCallback, useState } from "react";
import { ArrowRight, Bell, Timer, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useUnreadNotifications } from "../hooks/useUnreadNotifications";
import { useDashboardResource } from "../hooks/useDashboardResource";
import { ROUTES } from "../routes/paths";
import { fetchFocusStatistics } from "../services/focusStatisticsService";
import { verifiedActivity } from "../utils/studyActivity";
import type { StudyPeriod } from "../utils/studyActivity";
import StudyActivityChart from "../components/dashboard/StudyActivityChart";
import FocusInsights from "../components/dashboard/FocusInsights";
import DashboardMetrics from "../components/dashboard/DashboardMetrics";
import { DashboardGoals, DashboardRecent } from "../components/dashboard/DashboardContext";

function DashboardActivity({ days, onDaysChange, userId }: { days: StudyPeriod; onDaysChange: (days: StudyPeriod) => void; userId: number }) {
    const load = useCallback((signal: AbortSignal) => fetchFocusStatistics(days, signal), [days]);
    const { state, retry } = useDashboardResource(load);
    const stats = state.status === "success" ? state.data : null;
    const period = stats ? verifiedActivity(stats, days) : null;
    const from = stats?.daily[0]?.date, to = stats?.daily.at(-1)?.date;
    const hasCalendar = Boolean(stats?.activity?.length);
    return <>
        <DashboardMetrics days={days} stats={stats} period={period} loading={state.status === "loading"}/>
        <div className="dashboard-widgets" data-calendar={hasCalendar}>
            <StudyActivityChart days={days} onDaysChange={onDaysChange} status={state.status} period={period} timeZone={stats?.timeZone} onRetry={retry}/>
            <DashboardGoals userId={userId}/>
            {hasCalendar && stats ? <div id="dashboard-calendar"><RecordedCalendar activity={stats.activity}/></div> : null}
        </div>
        <div className="dashboard-bottom">
            {stats ? <FocusInsights data={stats} days={days} calendarOutside={hasCalendar}/> : null}
            {from && to && stats ? <DashboardRecent key={`${from}-${to}`} from={from} to={to} timeZone={stats.timeZone}/> : <section className="study-panel p-4 text-sm text-content-muted sm:p-5" aria-label="Recent study activity">{state.status === "loading" ? "Loading your study period…" : "Reload study activity to view recent attempts."}</section>}
        </div>
    </>;
}

function DashboardContent({ userId, username }: { userId: number; username: string }) {
    const [days, setDays] = useState<StudyPeriod>(7);
    const { unreadCount } = useUnreadNotifications();
    return <div className="academic-page academic-dashboard retro-dashboard cozy-dashboard min-w-0 space-y-4">
        <StudyEnvironment username={username}>
            <h1>Welcome back to <span>StudyStreak!</span></h1>
            <p className="cozy-hero-description">Keep the momentum going. A focused session today will take you closer to your goals.</p>
            <div className="cozy-hero-actions">
                <Link to={ROUTES.focusStudio} className="study-button border-accent bg-accent text-on-accent hover:bg-accent-hover"><Timer size={17} aria-hidden="true"/>Start focusing <ArrowRight size={15} aria-hidden="true"/></Link>
                <Link to={ROUTES.studyRooms} className="study-button cozy-room-link"><Users size={17} aria-hidden="true"/>Join a Study Room</Link>
            </div>
        </StudyEnvironment>
        <DashboardActivity days={days} onDaysChange={setDays} userId={userId}/>
        <Link to={ROUTES.notifications} className="flex min-h-11 flex-wrap items-center justify-between gap-3 rounded-control border border-outline px-4 py-3 text-sm text-content-secondary hover:bg-surface-hover"><span className="flex items-center gap-2"><Bell size={16} className="text-accent" aria-hidden="true"/>Your notifications</span><span className="text-content-muted">{unreadCount} unread <span aria-hidden="true">→</span></span></Link>
    </div>;
}

export default function Dashboard() {
    const { currentUser } = useAuth();
    return currentUser ? <DashboardContent key={currentUser.id} userId={currentUser.id} username={currentUser.username}/> : null;
}
