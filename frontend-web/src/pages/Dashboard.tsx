import { ArrowRight, BadgeCheck, Bell, BookOpen, Flame, Target } from "lucide-react";
import { Link } from "react-router-dom";
import SummaryCard from "../components/dashboard/SummaryCard";
import FocusStudio from "../components/dashboard/FocusStudio";
import { useAuth } from "../hooks/useAuth";
import { useUnreadNotifications } from "../hooks/useUnreadNotifications";
import { ROUTES } from "../routes/paths";
import {
    getGoalSummary,
    getRecordSummary,
    getStreakSummary,
    getValidationSummary
} from "../services/dashboardService";

function Dashboard() {
    const { currentUser } = useAuth();
    const { unreadCount } = useUnreadNotifications();

    if (!currentUser) {
        return null;
    }

    return (
        <div className="space-y-8">
            <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <p className="text-sm font-medium text-sky-400">Overview</p>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl">
                        Welcome back, {currentUser.username}
                    </h1>
                    <p className="mt-2 text-slate-400">Your study progress at a glance.</p>
                </div>
                <Link to={ROUTES.goals} className="inline-flex w-fit items-center gap-2 rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-sky-400">
                    View Goals <ArrowRight size={16} />
                </Link>
            </section>

            <FocusStudio key={currentUser.id} userId={currentUser.id} />

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Study statistics">
                <SummaryCard
                    key={`${currentUser.id}-goals`}
                    title="Goals"
                    icon={<Target size={20} />}
                    accent="bg-sky-950 text-sky-400"
                    href={ROUTES.goals}
                    action="Manage goals"
                    load={getGoalSummary}
                >
                    {summary => (
                        <div>
                            <p className="text-3xl font-bold text-slate-100">{summary.active}</p>
                            <p className="mt-1 text-sm text-slate-400">Active goals</p>
                            <p className="mt-3 text-sm text-slate-300">{summary.completed} completed</p>
                        </div>
                    )}
                </SummaryCard>

                <SummaryCard
                    key={`${currentUser.id}-streaks`}
                    title="Streaks"
                    icon={<Flame size={20} />}
                    accent="bg-orange-950 text-orange-400"
                    href={ROUTES.goals}
                    action="View goal streaks"
                    load={getStreakSummary}
                >
                    {summary => (
                        <div>
                            <p className="text-3xl font-bold text-slate-100">{summary.current} <span className="text-sm font-normal text-slate-400">days</span></p>
                            <p className="mt-1 text-sm text-slate-400">Highest current streak</p>
                            <p className="mt-3 text-sm text-slate-300">Best streak: {summary.best} days</p>
                        </div>
                    )}
                </SummaryCard>

                <SummaryCard
                    key={`${currentUser.id}-validations`}
                    title="Validations"
                    icon={<BadgeCheck size={20} />}
                    accent="bg-emerald-950 text-emerald-400"
                    href={ROUTES.validations}
                    action="View validations"
                    load={getValidationSummary}
                >
                    {summary => (
                        <div>
                            <p className="text-3xl font-bold text-slate-100">{summary.reviewed}</p>
                            <p className="mt-1 text-sm text-slate-400">Your records reviewed by peers</p>
                            <p className="mt-3 text-sm text-slate-300">{summary.awaitingReview} awaiting review</p>
                        </div>
                    )}
                </SummaryCard>

                <SummaryCard
                    key={`${currentUser.id}-records`}
                    title="Records"
                    icon={<BookOpen size={20} />}
                    accent="bg-violet-950 text-violet-400"
                    href={ROUTES.goals}
                    action="View study records"
                    load={getRecordSummary}
                >
                    {summary => (
                        <div>
                            <p className="text-3xl font-bold text-slate-100">{summary.lastSevenDays}</p>
                            <p className="mt-1 text-sm text-slate-400">Check-ins in the last 7 days</p>
                            <p className="mt-3 text-sm text-slate-300">Across all your goals</p>
                        </div>
                    )}
                </SummaryCard>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-100">Your Study Flow</h2>
                            <p className="mt-1 text-sm text-slate-400">Track your goals, log progress and get peer feedback.</p>
                        </div>
                        <Target size={23} className="shrink-0 text-sky-400" />
                    </div>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <Link to={ROUTES.goals} className="rounded-xl border border-slate-800 p-4 hover:bg-slate-800/60">
                            <p className="font-medium text-slate-100">1. Create a goal</p>
                            <p className="mt-1 text-sm text-slate-400">Set your study target.</p>
                        </Link>
                        <Link to={ROUTES.goals} className="rounded-xl border border-slate-800 p-4 hover:bg-slate-800/60">
                            <p className="font-medium text-slate-100">2. Log progress</p>
                            <p className="mt-1 text-sm text-slate-400">Record a study session.</p>
                        </Link>
                        <Link to={ROUTES.validations} className="rounded-xl border border-slate-800 p-4 hover:bg-slate-800/60">
                            <p className="font-medium text-slate-100">3. Validate</p>
                            <p className="mt-1 text-sm text-slate-400">Support a study partner.</p>
                        </Link>
                        <Link to={ROUTES.resources} className="rounded-xl border border-slate-800 p-4 hover:bg-slate-800/60">
                            <p className="font-medium text-slate-100">4. Find resources</p>
                            <p className="mt-1 text-sm text-slate-400">Search books for your study topics.</p>
                        </Link>
                    </div>
                    <Link to={ROUTES.notifications} className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 hover:bg-slate-800/60">
                        <span className="flex items-center gap-2 text-sm font-medium text-slate-200"><Bell size={17} className="text-sky-400" />Unread notifications</span>
                        <span className="rounded-full bg-sky-950 px-3 py-1 text-sm font-semibold text-sky-300" aria-label={`${unreadCount} unread notifications`}>{unreadCount}</span>
                    </Link>
                </div>
                <aside className="h-fit rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
                    <h2 className="text-lg font-semibold text-slate-100">Account</h2>
                    <div className="mt-5 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-950 font-semibold text-sky-300">
                            {currentUser.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate font-medium text-slate-100">{currentUser.username}</p>
                            <p className="truncate text-sm text-slate-500">{currentUser.email}</p>
                        </div>
                    </div>
                    <div className="mt-5 border-t border-slate-800 pt-5 text-sm">
                        <div className="flex justify-between gap-4">
                            <span className="text-slate-500">Role</span>
                            <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300">{currentUser.role}</span>
                        </div>
                    </div>
                </aside>
            </section>
        </div>
    );
}

export default Dashboard;
