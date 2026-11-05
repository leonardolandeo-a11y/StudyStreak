import { useEffect, useState } from 'react';
import { AppState, Pressable, Text, View } from 'react-native';
import { apiClient } from '../../services/apiClient';
import { listActiveFocusGoals, getMobileFocusSummary } from '../../features/focus/focusGoalService';
import { useAuth } from '../../hooks/useAuth';
import type { Goal } from '../../types/goal';
export function StudyRoomGoal({roomId}:{roomId:string}) {
 const {currentUser}=useAuth();
 const [goals,setGoals]=useState<Goal[]>([]);
 const [goal,setGoal]=useState<number|null>(null);
 const [recorded,setRecorded]=useState<string|null>(null);
 const [status,setStatus]=useState('Loading private selection…');
 const [error,setError]=useState<string|null>(null);
 const [revision,setRevision]=useState(0);
 useEffect(()=>{
  if(!currentUser)return;const controller=new AbortController();
  void listActiveFocusGoals(currentUser.id,controller.signal).then(setGoals).catch(()=>{if(!controller.signal.aborted)setError('Could not load Goals');});
  return ()=>controller.abort();
 },[currentUser]);
 useEffect(()=>{
  let active=true,loading=false;
  const refresh=async()=>{
   if(loading || AppState.currentState!=='active')return;loading=true;
   try{
    const {data}=await apiClient.get(`/api/study/rooms/${roomId}/selection`);
    const summary=data.goalId?await getMobileFocusSummary(data.goalId):null;
    if(!active)return;setGoal(data.goalId);setRecorded(summary?`${summary.totalMinutes} min / ${summary.completedSessions} sessions`:null);
    const session=data.sessions[0];setStatus(session?`${session.state}: ${session.confirmed_seconds/60} recorded / ${session.planned_seconds/60} planned min`:'No participation recorded yet');setError(null);
   }catch{if(active)setError('Recording data unavailable. Retrying…');}finally{loading=false;}
  };
  void refresh();const interval=setInterval(()=>{void refresh();},12000);
  const subscription=AppState.addEventListener('change',state=>{if(state==='active')void refresh();});
  return ()=>{active=false;clearInterval(interval);subscription.remove();};
 },[roomId,revision]);
 async function select(goalId:number|null){
  try{await apiClient.put(`/api/study/rooms/${roomId}/selection`,{goalId});setRevision(n=>n+1);}
  catch{setError('Select an owned active Goal before participating in this round.');}
 }
 const text={color:'#cbd5e1',fontSize:13};
 return <View style={{gap:12,padding:16,backgroundColor:'#132b24',borderRadius:16}}>
  <Text style={text}>Your private Goal (optional)</Text>
  {[{id:null,topic:'Study without recording a Goal'},...goals].map(item=><Pressable key={item.id??'none'} accessibilityRole="button" accessibilityState={{selected:goal===item.id}} onPress={()=>{void select(item.id);}}><Text style={{...text,color:goal===item.id?'#86efac':'#cbd5e1'}}>{goal===item.id?'✓ ':''}{item.topic}</Text></Pressable>)}
  <Text style={text}>Select a Goal and mark yourself studying. Only server-observed intervals count. Pauses and disconnected gaps do not; leaving or resetting cancels this round.</Text>
  <Text style={text}>{status}</Text>{recorded&&!error&&<Text style={text}>Recorded: {recorded}</Text>}
  {error&&<Text accessibilityRole="alert" style={{...text,color:'#fda4af'}}>{error}</Text>}
 </View>;
}
