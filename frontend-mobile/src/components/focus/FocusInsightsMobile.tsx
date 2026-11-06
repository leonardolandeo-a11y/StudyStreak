import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { displayFocusDuration, getMobileFocusStatistics } from '../../features/focus/focusStatisticsService';
import type { FocusStatistics } from '../../features/focus/focusStatisticsService';
import { palette } from '../../constants/palette';
import { MetricCard } from '../study/MetricCard';
import { ActionButton } from '../ui/ActionButton';
import { StudyAnalyticsDetails } from './StudyAnalyticsDetails';
export function FocusInsightsMobile({ refreshKey=0 }: {refreshKey?:number}) {
 const [days,setDays]=useState<7|30>(7),[revision,setRevision]=useState(0);
 const [data,setData]=useState<FocusStatistics|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(false);
 useFocusEffect(useCallback(()=>{
  void refreshKey;void revision;const controller=new AbortController();let sending=false;
  const load=async()=>{
   if(sending||AppState.currentState!=='active'||controller.signal.aborted)return;
   sending=true;setLoading(true);
   try{const result=await getMobileFocusStatistics(days,controller.signal);if(!controller.signal.aborted){setData(result);setError(false);}}
   catch{if(!controller.signal.aborted)setError(true);}finally{sending=false;if(!controller.signal.aborted)setLoading(false);}
  };
  void load();const interval=setInterval(()=>void load(),30000);const subscription=AppState.addEventListener('change',state=>{if(state==='active')void load();});
  return()=>{controller.abort();clearInterval(interval);subscription.remove();};
 },[days,refreshKey,revision]));
 return <View style={styles.container}>
  <Text style={styles.kicker}>YOUR PROGRESS</Text><Text style={styles.title}>Time well spent.</Text><Text style={styles.caption}>Saved sessions across Web and Mobile. Pending time is excluded.</Text>
  <View style={styles.row}>{([7,30] as const).map(option=><Pressable key={option} accessibilityRole="button" accessibilityState={{selected:days===option}} onPress={()=>{setDays(option);setData(null);}} style={[styles.tab,days===option&&{backgroundColor:palette.primary}]}><Text style={{color:days===option?palette.primaryText:palette.text,fontWeight:'600'}}>{option} days</Text></Pressable>)}<ActionButton secondary title="Refresh" onPress={()=>setRevision(n=>n+1)}/></View>
  {loading&&<ActivityIndicator accessibilityLabel="Updating study statistics" color={palette.primary}/>}
  {error&&<Text accessibilityRole="alert" style={styles.error}>Statistics unavailable. {data?'Showing the last saved snapshot.':''} Tap Refresh to retry.</Text>}
  {data&&<><View style={styles.row}>
   <MetricCard label="All-time recorded" value={displayFocusDuration(data.totalMinutes)} detail={`${data.verifiedMinutes} min verified · ${data.estimatedMinutes} min historical estimates`}/>
   <MetricCard label="Completed sessions" value={data.completedSessions} detail="Across all Goals"/>
   <MetricCard label={`Last ${days} days`} value={displayFocusDuration(data.periodMinutes)} detail={`${data.periodSessions} sessions · ${data.timeZone}`}/>
   <MetricCard label="This week" value={displayFocusDuration(data.weekMinutes)} detail="Monday through today"/>
  </View><StudyAnalyticsDetails key={days} data={data}/></>}
 </View>;
}
const styles=StyleSheet.create({container:{gap:16},row:{flexDirection:'row',flexWrap:'wrap',gap:10,alignItems:'center'},title:{color:palette.text,fontSize:28,fontWeight:'700'},kicker:{color:palette.primary,fontSize:12,fontWeight:'700',letterSpacing:2},caption:{color:palette.muted,fontSize:14,lineHeight:21},error:{color:palette.error,fontSize:14},tab:{minHeight:48,borderRadius:12,paddingHorizontal:18,paddingVertical:15,backgroundColor:palette.surfaceRaised}});
