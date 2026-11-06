import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import type { FocusStatistics } from '../../services/focusStatisticsService';
import { goalDetailsPath } from '../../routes/paths';
import { BarChart } from '../study/BarChart';
import { MetricCard } from '../study/MetricCard';
import { StudyTabs } from '../study/StudyTabs';
import { activityColor, barPercent, calendarPadding, sessionDate } from '../study/chartPresentation';
interface Entry { id: string; goal_name: string; source: string; state: string; confirmed_seconds: number; planned_seconds: number; verified: boolean; started_at: string; completed_at: string | null; }
const sections = ['Activity', 'Goals', 'Together', 'History'] as const;
const sectionTabs = sections.map(value => ({ value, label: value }));
export default function StudyAnalyticsDetails({ data }: { data: FocusStatistics }) {
 const [section,setSection]=useState<typeof sections[number]>('Activity');
 const [scale,setScale]=useState<'Daily'|'Weekly'|'Monthly'>('Daily');
 const [day,setDay]=useState<number|null>(null);
 const [page,setPage]=useState(0);
 const [revision,setRevision]=useState(0);
 const [history,setHistory]=useState<{content:Entry[];totalPages:number}|null>(null);
 const [error,setError]=useState(false);
 const from=data.daily[0]?.date, to=data.daily.at(-1)?.date;
 useEffect(()=>{
   if(section!=='History')return;
   const controller=new AbortController();
   void apiClient.get('/api/study/history',{params:{from,to,page},signal:controller.signal}).then(response=>{if(!controller.signal.aborted){setHistory(response.data);setError(false);}}).catch(()=>{if(!controller.signal.aborted)setError(true);});
   return ()=>controller.abort();
 },[from,to,page,data,section,revision]);
 const bars=scale==='Daily'?data.daily.map(item=>({label:item.date,value:item.minutes})):data[scale==='Weekly'?'weekly':'monthly'].map(item=>({label:item.date,value:item.hours*60}));
 const maxGoal=Math.max(0,...data.byGoal.map(item=>item.minutes));
 const selected=day===null?null:data.activity[day];
 return <div className="mt-6 space-y-6">
  <StudyTabs options={sectionTabs} value={section} onValueChange={setSection} label="Statistics sections">
  {section==='Activity'&&<div className="space-y-6">
   <div className="grid gap-3 sm:grid-cols-3">
    <MetricCard label="Active days" value={data.activeDays} detail={`In the last ${data.days} days`}/>
    <MetricCard label="Focus streak" value={`${data.studyStreak} days`} detail={`Best: ${data.bestStudyStreak} · separate from Daily Records`}/>
    <MetricCard label="Completion rate" value={data.completionPercent===null?'—':`${data.completionPercent.toFixed(0)}%`} detail="Completed / verified attempts started in this period"/>
   </div>
   <div className="study-panel space-y-5">
    <div className="flex flex-wrap gap-2" aria-label="Chart grouping">{(['Daily','Weekly','Monthly'] as const).map(item=><button type="button" key={item} className="study-tab" aria-pressed={scale===item} onClick={()=>setScale(item)}>{item}</button>)}</div>
    <BarChart key={scale} items={bars} label={`${scale} study time`}/>
    <p className="text-xs leading-relaxed text-slate-400">Buckets include only the selected {data.days}-day period; boundary weeks and months may be partial. Time is attributed to completion in {data.timeZone}.</p>
   </div>
   <section className="study-panel">
    <h3 className="text-lg font-semibold text-white">A year of showing up</h3><p className="mt-1 text-sm text-slate-400">Last 365 days · Monday at the top · scroll to explore</p>
    <div className="mt-5 overflow-x-auto pb-3"><div className="grid w-max grid-flow-col grid-rows-7 gap-1">
     {Array.from({length:calendarPadding(data.activity[0]?.date)},(_,i)=><span key={`pad-${i}`}/>)}
     {data.activity.map((item,index)=><button type="button" key={item.date} title={`${item.date}: ${item.minutes} min`} aria-label={`${item.date}: ${item.minutes} minutes, ${item.sessions} sessions`} onFocus={()=>setDay(index)} onClick={()=>setDay(index)} className="h-5 w-5 rounded-sm border border-white/5 focus-visible:z-10" style={{backgroundColor:activityColor(item.minutes)}}/>)}
    </div></div>
    <div className="mt-2 flex flex-wrap justify-between gap-3 text-sm text-slate-400"><p aria-live="polite">{selected?`${selected.date} · ${selected.minutes} min · ${selected.sessions} sessions`:'Select a day for details.'}</p><span>Intensity: 0 · 1–29 · 30–59 · 60+ min</span></div>
   </section>
   <div className="study-panel"><BarChart items={data.hourly.map(item=>({label:`${item.hour}:00`,value:item.hours*60}))} label="When sessions finish"/><p className="text-xs text-slate-400">Local completion hour, not minute-by-minute attendance.</p></div>
  </div>}
  {section==='Goals'&&<section className="study-panel space-y-5"><div><h3 className="text-lg font-semibold text-white">Where your time goes</h3><p className="mt-1 text-sm text-slate-400">All-time recorded time by Goal · includes labelled historical estimates</p></div>
   {data.byGoal.length===0?<p className="study-empty">Your first completed linked session will appear here.</p>:data.byGoal.map((goal,index)=><div key={`${goal.goalId}-${goal.topic}-${index}`}>
    <div className="flex flex-wrap justify-between gap-2 text-sm">{goal.goalId===null?<span className="text-slate-300">{goal.topic} · deleted</span>:<Link className="font-semibold text-white underline decoration-slate-600 underline-offset-4" to={goalDetailsPath(goal.goalId)}>{goal.topic}</Link>}<span className="text-emerald-200">{goal.minutes} min · {goal.sessions} sessions</span></div>
    <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-emerald-400" style={{width:`${barPercent(goal.minutes,maxGoal)}%`}}/></div>
   </div>)}
  </section>}
  {section==='Together'&&<div className="space-y-5">
   <div className="grid gap-3 sm:grid-cols-2"><MetricCard label="Individual" value={`${data.individualMinutes} min`} detail="Selected period · includes historical estimates"/><MetricCard label="Group" value={`${data.groupMinutes} min`} detail={`${data.groupSessions} completed group sessions`}/></div>
   <section className="study-panel space-y-4"><h3 className="text-lg font-semibold">Your study balance</h3><div className="flex h-5 overflow-hidden rounded-full bg-slate-800" role="img" aria-label={`Individual ${data.individualMinutes} minutes; group ${data.groupMinutes} minutes`}><div className="bg-emerald-400" style={{width:`${barPercent(data.individualMinutes,data.periodMinutes)}%`}}/><div className="bg-sky-200" style={{width:`${barPercent(data.groupMinutes,data.periodMinutes)}%`}}/></div><p className="text-sm text-slate-400">Mint: individual · light blue: group. Only saved time appears here.</p></section>
   <section className="study-panel"><BarChart items={[{label:'Previous',value:data.previousMinutes},{label:'Current',value:data.periodMinutes}]} label={`Two ${data.days}-day periods`}/><p className="text-sm text-slate-300">{data.changePercent===null?'No prior baseline for a percentage comparison.':`${data.changePercent>0?'+':''}${data.changePercent.toFixed(1)}% compared with the previous period.`}</p></section>
  </div>}
  {section==='History'&&<section className="space-y-4" aria-label="Session history">
   <div><h3 className="text-lg font-semibold">Session history</h3><p className="mt-1 text-sm text-slate-400">Starts in {from} – {to} · {data.timeZone}. Confirmed time can be shorter than planned.</p></div>
   {error?<div role="alert" className="study-empty"><p>History unavailable. Your saved sessions have not changed.</p><button type="button" className="study-button mt-3" onClick={()=>{setError(false);setHistory(null);setRevision(n=>n+1);}}>Retry history</button></div>:!history?<p role="status" className="study-empty">Loading saved sessions…</p>:history.content.length===0?<p className="study-empty">No attempts on this page in the selected period.</p>:<ol className="space-y-3">{history.content.map(item=><li key={item.id} className="study-panel">
    <div className="flex flex-wrap justify-between gap-3"><div className="min-w-0"><h4 className="break-words font-semibold text-white">{item.goal_name}</h4><p className="mt-1 text-sm text-slate-400">{sessionDate(item.started_at,data.timeZone)}</p></div><span className={`self-start rounded-md px-2 py-1 text-xs font-semibold ${item.state==='COMPLETE'?'bg-emerald-950 text-emerald-200':'bg-slate-800 text-slate-200'}`}>{item.state}</span></div>
    <div className="mt-4 flex flex-wrap items-baseline gap-2"><strong className="text-2xl tabular-nums">{item.confirmed_seconds/60} min</strong><span className="text-sm text-slate-400">saved / {item.planned_seconds/60} planned</span></div>
    <p className="mt-3 text-xs text-slate-400">{item.source} · {item.verified?'Server observed':'Historical estimate'} · Saved on server</p>
   </li>)}</ol>}
   <div className="flex flex-wrap items-center justify-between gap-3"><button type="button" className="study-button" disabled={page===0} onClick={()=>{setHistory(null);setPage(n=>n-1);}}>← Previous</button><span className="text-sm text-slate-400">Page {page+1}{history?` / ${Math.max(1,history.totalPages)}`:''}</span><button type="button" className="study-button" disabled={!history||page+1>=history.totalPages} onClick={()=>{setHistory(null);setPage(n=>n+1);}}>Next →</button></div>
  </section>}
  </StudyTabs>
 </div>;
}
