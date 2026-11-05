import { useEffect, useState } from 'react';
import apiClient from '../../services/apiClient';
import { getAllActiveGoals } from '../../services/activeGoalsService';
import { getFocusSummary } from '../../services/focusSessionService';
import { useAuth } from '../../hooks/useAuth';
import type { Goal } from '../../types/goal';
export default function StudyRoomGoal({roomId}:{roomId:string}) {
 const {currentUser}=useAuth();
 const [goals,setGoals]=useState<Goal[]>([]);
 const [goal,setGoal]=useState<number|null>(null);
 const [recorded,setRecorded]=useState<string|null>(null);
 const [status,setStatus]=useState('Loading private selection…');
 const [error,setError]=useState<string|null>(null);
 const [revision,setRevision]=useState(0);
 useEffect(()=>{
  if(!currentUser)return;
  const controller=new AbortController();
  void getAllActiveGoals(currentUser.id,controller.signal).then(setGoals).catch(()=>{if(!controller.signal.aborted)setError('Could not load Goals');});
  return ()=>controller.abort();
 },[currentUser]);
 useEffect(()=>{
  let active=true,loading=false;
  const refresh=async()=>{
   if(loading || document.visibilityState!=='visible')return;loading=true;
   try {
    const {data}=await apiClient.get(`/api/study/rooms/${roomId}/selection`);
    const summary=data.goalId ? await getFocusSummary(data.goalId) : null;
    if(!active)return;
    setGoal(data.goalId);setRecorded(summary?`${summary.totalMinutes} min / ${summary.completedSessions} sessions`:null);
    const session=data.sessions[0];
    setStatus(session?`${session.state}: ${session.confirmed_seconds/60} recorded / ${session.planned_seconds/60} planned min`:'No participation recorded in this room yet');setError(null);
   }catch{if(active)setError('Private recording data unavailable. Retrying…');}finally{loading=false;}
  };
  void refresh();const interval=setInterval(()=>{void refresh();},12000);
  window.addEventListener('focus',refresh);
  return ()=>{active=false;clearInterval(interval);window.removeEventListener('focus',refresh);};
 },[roomId,revision]);
 async function select(value:string){
  try{await apiClient.put(`/api/study/rooms/${roomId}/selection`,{goalId:value?Number(value):null});setRevision(n=>n+1);}
  catch{setError('Selection unavailable: use an owned active Goal before participating in this round.');}
 }
 return <section className="rounded-2xl border border-emerald-500/30 bg-slate-900 p-5 text-sm text-slate-300">
  <label htmlFor="private-room-goal" className="font-bold">Your private Goal (optional)</label>
  <select id="private-room-goal" value={goal??''} onChange={event=>void select(event.target.value)} className="my-3 block w-full rounded-lg bg-slate-950 p-3"><option value="">Study without recording a Goal</option>{goals.map(item=><option key={item.id} value={item.id}>{item.topic}</option>)}</select>
  <p>Select a Goal and mark yourself studying. Only server-observed intervals count; pauses and disconnected gaps do not. Leaving or resetting cancels this round.</p>
  <p className="mt-2" role="status">{status}</p>
  {recorded&&!error&&<p>Recorded for this Goal: {recorded}</p>}
  {error&&<p role="alert" className="text-rose-300">{error}</p>}
 </section>;
}
