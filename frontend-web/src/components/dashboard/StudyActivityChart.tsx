import { AcademicEmpty, PixelProgress } from "../academic/Academic";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartColumn, ChartLine, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import type { VerifiedFocusPeriod } from "../../services/focusStatisticsService";
import { ROUTES } from "../../routes/paths";
import { activityDate, activityNumber } from "../../utils/studyActivity";
import type { StudyPeriod } from "../../utils/studyActivity";
import LoadingState from "../ui/LoadingState";
import ErrorMessage from "../ui/ErrorMessage";

interface Props {
    days: StudyPeriod;
    onDaysChange: (days: StudyPeriod) => void;
    period: VerifiedFocusPeriod | null;
    status: "loading" | "error" | "success";
    timeZone?: string;
    onRetry: () => void;
}

export default function StudyActivityChart({ days, onDaysChange, period, status, timeZone, onRetry }: Props) {
    const [style, setStyle] = useState<"bars" | "lines">("bars");
    const Chart = style === "bars" ? BarChart : LineChart;
    return <section className="study-panel min-w-0 p-4 sm:p-5" aria-labelledby="study-activity-heading" aria-busy={status === "loading"}>
        <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h2 id="study-activity-heading" className="text-xl font-semibold text-content">Study activity</h2><p className="mt-1 text-sm text-content-muted">Daily focus · confirmed minutes</p></div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-1 rounded-control border border-outline p-1" role="group" aria-label="Study period">
                {([7, 30] as const).map(value => <button key={value} type="button" className="study-tab px-3" aria-pressed={days === value} onClick={() => onDaysChange(value)}>{value} days</button>)}
              </div>
              <button type="button" className="study-button size-11 shrink-0 p-0" aria-label="Refresh progress" title={status === "loading" ? "Refreshing progress…" : "Refresh progress"} aria-busy={status === "loading"} disabled={status === "loading"} onClick={onRetry}><RefreshCw size={17} aria-hidden="true" className={status === "loading" ? "animate-spin" : undefined}/></button>
            </div>
        </div>
        <div className="my-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-content-muted">{period ? `${activityDate(period.daily[0].date)} – ${activityDate(period.daily.at(-1)!.date)}` : `Last ${days} days`}{timeZone ? ` · ${timeZone}` : ""}</p>
            <div className="flex gap-1" role="group" aria-label="Chart style">
                <button type="button" className="study-tab inline-flex items-center gap-2 px-3" aria-pressed={style === "bars"} onClick={() => setStyle("bars")}><ChartColumn size={16} aria-hidden="true"/>Bars</button>
                <button type="button" className="study-tab inline-flex items-center gap-2 px-3" aria-pressed={style === "lines"} onClick={() => setStyle("lines")}><ChartLine size={16} aria-hidden="true"/>Lines</button>
            </div>
        </div>
        {status === "loading" ? <LoadingState message="Loading verified study activity…"/>
        : status === "error" || !period ? <div className="space-y-3"><ErrorMessage message={status === "error" ? "Study activity could not be loaded. Your saved sessions are safe." : "Verified statistics are unavailable. The server needs the verifiedPeriod update."}/><button type="button" className="study-button" onClick={onRetry}>Retry study activity</button></div>
        : <>
            {period.sessions === 0 ? <div className="study-empty p-4"><AcademicEmpty><p>No verified sessions completed in these {days} days.</p></AcademicEmpty><Link className="mt-2 inline-flex min-h-11 items-center font-semibold text-accent" to={ROUTES.focusStudio}>Open Focus Studio</Link></div>
            : <div className="h-64 w-full min-w-0 sm:h-72" role="img" aria-label={`Daily verified focus: ${activityNumber(period.minutes)} minutes in ${period.sessions} sessions. Full daily values in the table below.`}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <Chart data={period.daily} margin={{ top: 12, right: 8, bottom: 0, left: -16 }} accessibilityLayer>
                        <CartesianGrid vertical={false} stroke="var(--ss-border)"/>
                        <XAxis dataKey="date" tickFormatter={date => activityDate(String(date))} tick={{ fill: "var(--ss-text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={24} tickMargin={12}/>
                        <YAxis tick={{ fill: "var(--ss-text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={52}/>
                        <Tooltip labelFormatter={label => activityDate(String(label), true)} formatter={value => [`${activityNumber(Number(value))} min`, "Confirmed focus"]} contentStyle={{ background: "var(--ss-surface)", border: "1px solid var(--ss-border-strong)", borderRadius: "var(--ss-radius-control)", color: "var(--ss-text)" }} itemStyle={{ color: "var(--ss-accent)" }} labelStyle={{ color: "var(--ss-text)" }} cursor={{ stroke: "var(--ss-border-strong)", fill: "var(--ss-accent-soft)" }}/>
                        {style === "bars" ? <Bar dataKey="minutes" fill="var(--ss-accent)" radius={[2, 2, 0, 0]} maxBarSize={36} isAnimationActive={false}/>
                        : <Line type="linear" dataKey="minutes" stroke="var(--ss-accent)" strokeWidth={3} dot={{ r: 3, fill: "var(--ss-accent)" }} activeDot={{ r: 5 }} isAnimationActive={false}/>}
                    </Chart>
                </ResponsiveContainer>
            </div>}
            <div className="mt-3 flex flex-wrap justify-between gap-2 border-t border-outline pt-3 text-xs text-content-muted"><span>{period.daily.filter(day => day.minutes > 0).length} active days of {days}</span><span>Completed individual & group sessions</span></div>
            <PixelProgress value={period.daily.filter(day => day.minutes > 0).length} max={days} label="Active study days in this period" />
            <details className="mt-2 text-sm text-content-secondary"><summary className="w-fit cursor-pointer rounded-control px-1 py-2 font-medium">View daily data</summary><div className="mt-2 overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Daily verified focus in {timeZone}; minutes and completed sessions</caption><thead><tr className="border-b border-outline text-content-muted"><th scope="col" className="py-2 pr-3">Date</th><th scope="col" className="py-2 pr-3">Minutes</th><th scope="col" className="py-2">Sessions</th></tr></thead><tbody>{period.daily.map(day => <tr key={day.date} className="border-b border-outline"><th scope="row" className="py-2 pr-3 font-normal"><time dateTime={day.date}>{activityDate(day.date, true)}</time></th><td className="pr-3 tabular-nums">{activityNumber(day.minutes)}</td><td className="tabular-nums">{day.sessions}</td></tr>)}</tbody></table></div></details>
        </>}
        <p className="mt-3 text-xs leading-relaxed text-content-muted">Only completed, server-verified sessions count here. Historical estimates, breaks and unfinished attempts are excluded. Days follow your account time zone.</p>
    </section>;
}
