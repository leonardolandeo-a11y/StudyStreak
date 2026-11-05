import StudyAnalyticsDetails from "./StudyAnalyticsDetails";
import { useEffect, useState } from "react";
import { Activity, CalendarDays, Clock3, RefreshCw, Target, Timer } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchFocusStatistics, focusDuration } from "../../services/focusStatisticsService";
import type { FocusStatistics } from "../../services/focusStatisticsService";
import { goalDetailsPath } from "../../routes/paths";

export default function FocusInsights({ refreshKey = 0, compact = false }: {
    refreshKey?: number;
    compact?: boolean;
}) {
    const [days, setDays] = useState<7 | 30>(7);
    const [data, setData] = useState<FocusStatistics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [revision, setRevision] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        let request = 0;
        const load = () => {
            const sequence = ++request;
            setLoading(true);
            setError(null);
            void fetchFocusStatistics(days, controller.signal).then(stats => {
                if (!controller.signal.aborted && sequence === request) setData(stats);
            }).catch(() => {
                if (!controller.signal.aborted && sequence === request) setError("Could not load your focus statistics.");
            }).finally(() => {
                if (!controller.signal.aborted && sequence === request) setLoading(false);
            });
        };
        load();
        const interval = window.setInterval(() => { if (document.visibilityState === "visible") load(); }, 30000);
        const refreshVisible = () => {
            if (document.visibilityState === "visible") load();
        };
        document.addEventListener("visibilitychange", refreshVisible);
        window.addEventListener("focus", refreshVisible);
        return () => {
            controller.abort();
            window.clearInterval(interval);
            document.removeEventListener("visibilitychange", refreshVisible);
            window.removeEventListener("focus", refreshVisible);
        };
    }, [days, refreshKey, revision]);

    const maxDaily = Math.max(1, ...(data?.daily.map(day => day.minutes) ?? []));
    const maxGoal = Math.max(1, ...(data?.byGoal.map(goal => goal.minutes) ?? []));

    return (
        <section aria-label="Focus study statistics"
            className="rounded-[26px] border border-white/10 bg-[#111820] p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-white">
                        <Activity size={21} className="text-emerald-400" aria-hidden="true" />
                        Your study statistics
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                        Confirmed focus sessions synced from Web and Mobile.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex rounded-full border border-white/10 bg-slate-950 p-1">
                        {([7, 30] as const).map(option => (
                            <button type="button" key={option} onClick={() => setDays(option)}
                                aria-pressed={days === option}
                                className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                                    days === option ? "bg-emerald-400 text-slate-950" :
                                        "text-slate-400 hover:text-white"
                                }`}>
                                {option} days
                            </button>
                        ))}
                    </div>
                    <button type="button" aria-label="Refresh focus statistics"
                        onClick={() => setRevision(value => value + 1)}
                        className="rounded-full border border-white/10 p-2 text-slate-300 hover:bg-white/10">
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            {error && <p role="alert" className="mt-4 text-sm text-rose-300">{error}</p>}
            {loading && !data && <p className="mt-6 text-sm text-slate-400">Loading study statistics…</p>}
            {data && (
                <>
                    <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                        {[
                            { icon: Clock3, title: "All-time focus", value: focusDuration(data.totalMinutes), detail: "Synced study time" },
                            { icon: Timer, title: "Completed sessions", value: data.completedSessions.toLocaleString(), detail: "Across all Goals" },
                            { icon: CalendarDays, title: `Last ${days} days`, value: focusDuration(data.periodMinutes), detail: `${data.periodSessions} completed sessions` },
                            { icon: Target, title: "Best day", value: focusDuration(data.bestDayMinutes), detail: "In selected period" }
                        ].map(item => (
                            <div key={item.title} className="rounded-2xl border border-emerald-400/10 bg-slate-950/70 p-3 sm:p-4">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                                    <item.icon size={15} className="text-emerald-400" aria-hidden="true" />
                                    {item.title}
                                </div>
                                <p className="mt-3 text-2xl font-black tabular-nums text-white sm:text-3xl">{item.value}</p>
                                <p className="mt-1 text-[11px] text-slate-500">{item.detail}</p>
                            </div>
                        ))}
                    </div>

                    {!compact && (
                        <div className="mt-7 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
                            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className="text-sm font-bold text-slate-200">Daily focus minutes</h3>
                                    <span className="text-xs text-slate-400">{days}-day activity</span>
                                </div>
                                <div className="mt-6 flex h-40 items-end gap-1.5 sm:gap-2" role="img"
                                    aria-label={data.daily.map(day => `${day.date}: ${day.minutes} minutes`).join("; ")}>
                                    {data.daily.map((day, i) => (
                                        <div key={day.date} className="group flex h-full min-w-0 flex-1 flex-col justify-end gap-1">
                                            <div title={`${day.date}: ${day.minutes} min, ${day.sessions} sessions`}
                                                className={`w-full rounded-t-md transition-colors ${
                                                    day.minutes > 0 ? "bg-emerald-400/80 group-hover:bg-emerald-300"
                                                        : "bg-slate-800/70"
                                                }`}
                                                style={{ height: `${Math.max(3, day.minutes / maxDaily * 100)}%` }} />
                                            {(days === 7 || i % 5 === 0 || i === data.daily.length - 1) && (
                                                <span className="text-center text-[10px] tabular-nums text-slate-500">
                                                    {day.date.slice(5)}
                                                </span>
                                            )}
                                            {days === 30 && i % 5 !== 0 && i !== data.daily.length - 1 && (
                                                <span aria-hidden="true" className="text-[10px]">&nbsp;</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                                <h3 className="text-sm font-bold text-slate-200">Time by Goal</h3>
                                {data.byGoal.length === 0 ? (
                                    <p className="mt-5 text-sm text-slate-400">Complete a linked Pomodoro to start building your history.</p>
                                ) : (
                                    <div className="mt-5 space-y-4">
                                        {data.byGoal.slice(0, 5).map(goal => (
                                            <div key={`${goal.goalId}-${goal.topic}`}>
                                                <div className="flex items-baseline justify-between gap-3 text-xs">
                                                    <Link to={goal.goalId===null ? "#" : goalDetailsPath(goal.goalId)}
                                                        className="max-w-[70%] truncate font-semibold text-slate-200 hover:text-emerald-300">
                                                        {goal.topic}{goal.goalId===null ? " (deleted)" : ""}
                                                    </Link>
                                                    <span className="shrink-0 tabular-nums text-emerald-300">{focusDuration(goal.minutes)}</span>
                                                </div>
                                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                                                    <div className="h-full rounded-full bg-emerald-400"
                                                        style={{ width: `${100 * goal.minutes / maxGoal}%` }} />
                                                </div>
                                                <p className="mt-1 text-[11px] text-slate-500">{goal.sessions} sessions</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {!compact && <StudyAnalyticsDetails key={days} data={data}/> }
                    <p className="mt-4 text-xs text-slate-500">
                        Recorded totals include verified time and separately labelled historical estimates. Pending sessions are excluded.
                    </p>
                </>
            )}
        </section>
    );
}
