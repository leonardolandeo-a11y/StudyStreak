import { RecordedSummary } from "../study/RecordedSummary";
import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { AppState, Text, View, ScrollView } from 'react-native';
import { apiClient } from '../../services/apiClient';
import { listActiveFocusGoals, getMobileFocusSummary } from '../../features/focus/focusGoalService';
import { useAppearance } from '../../hooks/useAppearance';
import { NavigationPressable } from '../navigation/NavigationPressable';
import { useAuth } from '../../hooks/useAuth';
import type { Goal } from '../../types/goal';
export function StudyRoomGoal({roomId}:{roomId:string}) {
 const {theme:{colors:palette}}=useAppearance();
 const {currentUser}=useAuth();
 const [goals,setGoals]=useState<Goal[]>([]);
 const [goal,setGoal]=useState<number|null>(null);
 const [recorded,setRecorded]=useState<{totalMinutes:number;completedSessions:number}|null>(null);
 const [status,setStatus]=useState('Loading private selection…');
 const [error,setError]=useState<string|null>(null);
 const [expanded,setExpanded]=useState(false);
 const [revision,setRevision]=useState(0);
 const latestRevision=useRef(revision);
 useFocusEffect(useCallback(()=>{
  if(!currentUser)return;const controller=new AbortController();
  void listActiveFocusGoals(currentUser.id,controller.signal).then(data=>{if(!controller.signal.aborted)setGoals(data);}).catch(()=>{if(!controller.signal.aborted)setError('Could not load Goals');});
  return ()=>controller.abort();
 },[currentUser]));
 useFocusEffect(useCallback(()=>{
  let active=true,loading=false;const controller=new AbortController();latestRevision.current=revision;
  const refresh=async()=>{
   if(!active || loading || latestRevision.current!==revision || AppState.currentState!=='active')return;loading=true;
   try{
    const {data}=await apiClient.get(`/api/study/rooms/${roomId}/selection`,{signal:controller.signal});
    const summary=data.goalId?await getMobileFocusSummary(data.goalId,controller.signal):null;
    if(!active)return;setGoal(data.goalId);setRecorded(summary);
    const session=data.sessions[0];setStatus(session?`${session.state}: ${session.confirmed_seconds/60} recorded / ${session.planned_seconds/60} planned min`:'No participation recorded yet');setError(null);
   }catch{if(active)setError('Recording data unavailable. Retrying…');}finally{loading=false;}
  };
  void refresh();const interval=setInterval(()=>{void refresh();},12000);
  const subscription=AppState.addEventListener('change',state=>{if(state==='active')void refresh();});
  return ()=>{active=false;controller.abort();clearInterval(interval);subscription.remove();};
 },[roomId,revision]));
 async function select(goalId:number|null){
  try{await apiClient.put(`/api/study/rooms/${roomId}/selection`,{goalId});setRevision(n=>n+1);}
  catch{setError('Select an owned active Goal before participating in this round.');}
 }
 const text={color:palette.text,fontSize:13,lineHeight:20};
 return <View style={{gap:14,padding:12,backgroundColor:palette.surface,borderRadius:16,borderWidth:1,borderColor:palette.border}}>
  <Text style={{...text,fontSize:18,fontWeight:"700"}}>Your private progress</Text><Text style={text}>Only you can see this Goal.</Text><NavigationPressable accessibilityRole="button" accessibilityState={{expanded}} onPress={()=>setExpanded(value=>!value)} style={{minHeight:48,padding:12,borderRadius:12,backgroundColor:palette.surfaceRaised}}><Text style={text}>{goals.find(item=>item.id===goal)?.topic??"No Goal selected"} · {expanded?"Close":"Choose"}</Text></NavigationPressable>
  {expanded&&<ScrollView nestedScrollEnabled style={{maxHeight:240}}>{[{id:null,topic:'Study without recording a Goal'},...goals].map(item=><NavigationPressable key={item.id??'none'} accessibilityRole="button" accessibilityState={{selected:goal===item.id}} onPress={()=>{void select(item.id);setExpanded(false);}} style={{minHeight:48,paddingVertical:12}}><Text style={{...text,color:goal===item.id?palette.primary:palette.text}}>{goal===item.id?'✓ ':''}{item.topic}</Text></NavigationPressable>)}</ScrollView>}
  <Text style={text}>Select a Goal and mark yourself studying. Only server-observed intervals count. Pauses and disconnected gaps do not; leaving or resetting cancels this round.</Text>
  <Text style={text}>{status}</Text>{goal!==null&&<RecordedSummary embedded minutes={recorded?.totalMinutes} sessions={recorded?.completedSessions} error={!!error} onRefresh={()=>setRevision(n=>n+1)}/>}
  {error&&<Text accessibilityRole="alert" style={{...text,color:palette.error}}>{error}</Text>}
 </View>;
}
