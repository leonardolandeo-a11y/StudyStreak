import StudyAnalyticsDetails from "./StudyAnalyticsDetails";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { MetricCard } from "../study/MetricCard";
import { fetchFocusStatistics, focusDuration } from "../../services/focusStatisticsService";
import type { FocusStatistics } from "../../services/focusStatisticsService";

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

    return <section aria-label="Focus study statistics" className="study-panel">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="study-kicker">Your progress</p><h2 className="mt-2 text-2xl font-semibold text-white">Time well spent.</h2><p className="mt-2 text-sm text-slate-400">Saved sessions across Web and Mobile. Pending time is excluded.</p></div>
        <div className="flex flex-wrap items-center gap-2">
          {([7,30] as const).map(option=><button type="button" className="study-tab" key={option} aria-pressed={days===option} onClick={()=>{setDays(option);setData(null);}}>{option} days</button>)}
          <button type="button" className="study-button" aria-label="Refresh focus statistics" onClick={()=>setRevision(n=>n+1)}><RefreshCw size={16}/>{loading?'Updating…':'Refresh'}</button>
        </div>
      </div>
      {error&&<p role="alert" className="mt-4 text-sm text-rose-300">{error} {data?'Showing the last saved snapshot.':''}</p>}
      {loading&&!data&&<p role="status" className="study-empty mt-5">Loading your recorded progress…</p>}
      {data&&<>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="All-time recorded" value={focusDuration(data.totalMinutes)} detail={`${data.verifiedMinutes} min verified · ${data.estimatedMinutes} min historical estimates`}/>
          <MetricCard label="Completed sessions" value={data.completedSessions} detail="Across all Goals"/>
          <MetricCard label={`Last ${days} days`} value={focusDuration(data.periodMinutes)} detail={`${data.periodSessions} sessions · ${data.timeZone}`}/>
          <MetricCard label="This week" value={focusDuration(data.weekMinutes)} detail="Monday through today"/>
        </div>
        {!compact&&<StudyAnalyticsDetails key={days} data={data}/>}
      </>}
    </section>;
}
