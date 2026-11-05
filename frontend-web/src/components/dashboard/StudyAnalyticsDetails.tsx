import { useEffect, useState } from 'react';
import apiClient from '../../services/apiClient';
import type { FocusStatistics } from '../../services/focusStatisticsService';
interface Entry { id: string; goal_name: string; source: string; state: string; confirmed_seconds: number; planned_seconds: number; verified: boolean; }
export default function StudyAnalyticsDetails({ data }: { data: FocusStatistics }) {
 const [page,setPage]=useState(0);
 const [history,setHistory]=useState<{content:Entry[];totalPages:number}|null>(null);
 const [error,setError]=useState(false);
 const from=data.daily[0]?.date, to=data.daily.at(-1)?.date;
 useEffect(()=>{
   const controller=new AbortController();
   void apiClient.get('/api/study/history',{params:{from,to,page},signal:controller.signal}).then(response=>{if(!controller.signal.aborted){setHistory(response.data);setError(false);}}).catch(()=>{if(!controller.signal.aborted)setError(true);});
   return ()=>controller.abort();
 },[from,to,page,data]);
 return <div className="mt-6 space-y-5 text-sm text-slate-300">
   <p>Verified: {data.verifiedMinutes} min · Historical estimates: {data.estimatedMinutes} min. Dates use {data.timeZone}.</p>
   <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
    {[
      ['Individual / group',`${data.individualMinutes} / ${data.groupMinutes} min`],
      ['Group sessions',data.groupSessions],['Previous period',`${data.previousMinutes} min`],
      ['Change',data.changePercent===null?'No prior baseline':`${data.changePercent.toFixed(1)}%`],
      ['Completion rate',data.completionPercent===null?'No verified attempts':`${data.completionPercent.toFixed(1)}%`],
      ['Average session',`${data.averageMinutes.toFixed(1)} min`],['Active days',data.activeDays],
      ['Study streak',`${data.studyStreak} days · best ${data.bestStudyStreak}`],
    ].map(([label,value])=><div key={label} className="rounded-xl bg-slate-950 p-3"><p>{label}</p><strong className="text-emerald-300">{value}</strong></div>)}
   </div>
   <p>This week: {(data.weekMinutes/60).toFixed(2)} hours. Study streaks are independent of Daily Records.</p>
   <h3 className="font-bold">Activity · last 365 days</h3>
   <div className="flex flex-wrap gap-1" role="img" aria-label="Study activity by date">
     {data.activity.map(day=><span key={day.date} title={`${day.date}: ${day.minutes} min`} aria-label={`${day.date}: ${day.minutes} min`} className="h-3 w-3 rounded-sm" style={{backgroundColor:day.minutes===0?'#253242':day.minutes<30?'#166534':day.minutes<60?'#16a34a':'#86efac'}}/>)}
   </div>
   <h3 className="font-bold">Hours by day / week / month</h3>
   <div className="grid gap-3 md:grid-cols-3">
     {[data.daily.map(day=>({date:day.date,hours:day.minutes/60})),data.weekly,data.monthly].map((series,index)=><ul key={index} className="max-h-40 overflow-auto">{series.map(item=><li key={item.date}>{item.date}: {item.hours.toFixed(2)} h</li>)}</ul>)}
   </div>
   <h3 className="font-bold">Completion time of day</h3>
   <div className="grid grid-cols-6 gap-2">{data.hourly.map(item=><span key={item.hour}>{item.hour}:00 · {item.hours.toFixed(1)} h</span>)}</div>
   <h3 className="font-bold">Session history · selected period</h3>
   {error?<p role="alert">History unavailable. Retry by changing page or refreshing.</p>:!history?<p>Loading history…</p>:history.content.length===0?<p>No attempts in this period.</p>:<ul>{history.content.map(item=><li key={item.id} className="border-b border-slate-800 py-2">{item.goal_name} · {item.source} · {item.state} · {item.confirmed_seconds/60} recorded / {item.planned_seconds/60} planned min · {item.verified?'Server observed':'Historical estimate'}</li>)}</ul>}
   <div className="flex gap-4"><button disabled={page===0} onClick={()=>{setHistory(null);setPage(value=>value-1);}}>Previous</button><span>Page {page+1}</span><button disabled={!history||page+1>=history.totalPages} onClick={()=>{setHistory(null);setPage(value=>value+1);}}>Next</button></div>
 </div>;
}
