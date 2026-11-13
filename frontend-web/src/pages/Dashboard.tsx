import { useDashboardWidgets } from '../hooks/useDashboardWidgets';
import { CustomizeDashboard } from '../components/dashboard/CustomizeDashboard';
import { DashboardPartners } from '../components/dashboard/DashboardPartners';
import { useReducedMotion } from '../theme/appearance';
import '../components/dashboard/cozy-dashboard.css';
import { StudyEnvironment } from '../components/environment/StudyEnvironment';
import { useCallback, useLayoutEffect, useRef, useState } from "react";
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
    const layout = useDashboardWidgets(userId);
    const reduced = useReducedMotion();
    const grid = useRef<HTMLDivElement>(null);
    const previous = useRef(new Map<string, { x: number; y: number }>());
    useLayoutEffect(() => {
        const next = new Map<string, { x: number; y: number }>();
        grid.current?.querySelectorAll<HTMLElement>('[data-widget]').forEach(element => {
            const id = element.dataset.widget!, box = element.getBoundingClientRect(), origin = grid.current!.getBoundingClientRect();
            const rect = { x: box.x-origin.x, y: box.y-origin.y }, before = previous.current.get(id);
            next.set(id, rect);
            if (before && !reduced && (before.x !== rect.x || before.y !== rect.y)) element.animate?.([
                { transform: `translate(${before.x-rect.x}px,${before.y-rect.y}px)` }, { transform: 'translate(0,0)' },
            ], { duration: 220, easing: 'ease-out' });
        });
        previous.current = next;
    }, [layout.rows, reduced]);
    return <>
        <CustomizeDashboard {...layout}/>
        <div ref={grid} className="custom-widget-grid" aria-label="Dashboard widgets">
        {(layout.ready ? layout.rows : []).filter(row => row.visible).map(row => <div className={`dashboard-widget widget-${row.id}`} data-widget={row.id} key={row.id}>
            {row.id === 'focus-summary' && <DashboardMetrics group="focus" days={days} stats={stats} period={period} loading={state.status === 'loading'}/>}
            {row.id === 'streak' && <DashboardMetrics group="streak" days={days} stats={stats} period={period} loading={state.status === 'loading'}/>}
            {row.id === 'activity' && <StudyActivityChart days={days} onDaysChange={onDaysChange} status={state.status} period={period} timeZone={stats?.timeZone} onRetry={retry}/>}
            {row.id === 'goals' && <DashboardGoals userId={userId}/>}
            {row.id === 'journey' && (stats ? <FocusInsights data={stats} days={days}/> : <section className="study-panel p-4">{state.status === 'loading' ? 'Loading study journey…' : 'Reload study activity to view your journey.'}</section>)}
            {row.id === 'recent' && (from && to && stats ? <DashboardRecent key={`${from}-${to}`} from={from} to={to} timeZone={stats.timeZone}/> : <section className="study-panel p-4 text-sm" aria-label="Recent study activity">{state.status === 'loading' ? 'Loading your study period…' : 'Reload study activity to view recent attempts.'}</section>)}
            {row.id === 'partners' && <DashboardPartners userId={userId}/>}
            {row.id === 'quick' && <section className="study-panel p-4"><h2 className="text-lg font-bold">Quick Focus</h2><p className="my-2 text-sm text-content-secondary">Make room for your next focused session.</p><Link to={ROUTES.focusStudio} className="study-button"><Timer size={18}/>Open Focus Studio</Link></section>}
        </div>)}
        </div>
        {!layout.rows.some(row => row.visible) && <p role="status" className="study-panel p-4">Your Dashboard is clear. Use Customize Dashboard to show widgets.</p>}
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
