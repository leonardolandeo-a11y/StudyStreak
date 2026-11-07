import { RefreshCw } from "lucide-react";

interface RecordedSummaryProps {
    minutes?: number;
    sessions?: number;
    error?: boolean;
    pending?: number;
    onRefresh?: () => void;
    updatedAt?: number;
    compact?: boolean;
}

export function RecordedSummary({ minutes, sessions, error = false, pending, onRefresh, updatedAt, compact = false }: RecordedSummaryProps) {
    return <section aria-label="Recorded for this Goal" className={compact ? "rounded-control border border-outline bg-canvas p-3" : "rounded-xl border border-emerald-400/30 bg-slate-950 p-4"}>
        <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="study-kicker">Recorded for this Goal</h3>
            {onRefresh && (compact
                ? <button type="button" className="study-button size-11 p-0" aria-label="Refresh recorded goal totals" title="Refresh recorded goal totals" onClick={onRefresh}><RefreshCw size={16} aria-hidden="true"/></button>
                : <button type="button" className="study-button" onClick={onRefresh}>Refresh</button>)}
        </div>
        <div className={compact ? "mt-2 grid grid-cols-2 gap-3" : "mt-4 grid grid-cols-2 gap-4"}>
            <div><p className={compact ? "text-2xl font-semibold text-content tabular-nums" : "text-4xl font-semibold tabular-nums text-white"}>{minutes ?? '—'}</p><p className={compact ? "mt-1 text-xs text-content-muted" : "mt-2 text-sm text-slate-400"}>confirmed minutes</p></div>
            <div><p className={compact ? "text-2xl font-semibold text-content tabular-nums" : "text-4xl font-semibold tabular-nums text-white"}>{sessions ?? '—'}</p><p className={compact ? "mt-1 text-xs text-content-muted" : "mt-2 text-sm text-slate-400"}>completed sessions</p></div>
        </div>
        <p role="status" className={`${compact ? "mt-2 text-xs" : "mt-4 text-sm"} ${error ? 'text-amber-200' : compact ? 'text-content-muted' : 'text-slate-400'}`}>{error ? (minutes === undefined ? 'Totals unavailable · retry to confirm' : 'Update failed · showing last confirmed totals') : minutes === undefined ? 'Loading recorded totals…' : 'Server-confirmed snapshot · all time'}</p>
        {updatedAt && !error && <p className="mt-1 text-xs text-slate-400">Retrieved at {new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>}
        {pending !== undefined && <p className={`${compact ? "mt-1 text-xs" : "mt-2 text-sm"} ${pending > 0 ? 'text-amber-200' : compact ? 'text-content-muted' : 'text-slate-400'}`}>{pending > 0 ? `${pending} pending on this device · excluded from totals` : 'No pending completions in this view'}</p>}
    </section>;
}
