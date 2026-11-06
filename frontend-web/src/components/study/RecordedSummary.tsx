export function RecordedSummary({minutes,sessions,error=false,pending,onRefresh,updatedAt}:{minutes?:number;sessions?:number;error?:boolean;pending?:number;onRefresh?:()=>void;updatedAt?:number}) {
 return <section aria-label="Recorded for this Goal" className="rounded-xl border border-emerald-400/30 bg-slate-950 p-4">
  <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="study-kicker">Recorded for this Goal</h3>{onRefresh&&<button type="button" className="study-button" onClick={onRefresh}>Refresh</button>}</div>
  <div className="mt-4 grid grid-cols-2 gap-4"><div><p className="text-4xl font-semibold tabular-nums text-white">{minutes??'—'}</p><p className="mt-2 text-sm text-slate-400">confirmed minutes</p></div><div><p className="text-4xl font-semibold tabular-nums text-white">{sessions??'—'}</p><p className="mt-2 text-sm text-slate-400">completed sessions</p></div></div>
  <p role="status" className={`mt-4 text-sm ${error?'text-amber-200':'text-slate-400'}`}>{error?(minutes===undefined?'Totals unavailable · retry to confirm':'Update failed · showing last confirmed totals'):minutes===undefined?'Loading recorded totals…':'Server-confirmed snapshot · all time'}</p>
  {updatedAt&&!error&&<p className="mt-1 text-xs text-slate-400">Retrieved at {new Date(updatedAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</p>}
  {pending!==undefined&&<p className={`mt-2 text-sm ${pending>0?'text-amber-200':'text-slate-400'}`}>{pending>0?`${pending} pending on this device · excluded from totals`:'No pending completions in this view'}</p>}
 </section>;
}
