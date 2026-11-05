import { useEffect, useState } from 'react';
import { Text, View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { apiClient } from '../../services/apiClient';
import type { FocusStatistics } from '../../features/focus/focusStatisticsService';
import { palette } from '../../constants/palette';
import { BarChart } from '../study/BarChart';
import { MetricCard } from '../study/MetricCard';
import { ActionButton } from '../ui/ActionButton';
import { activityColor, barPercent, calendarPadding, sessionDate } from '../study/chartPresentation';
interface Entry { id:string;goal_name:string;source:string;state:string;confirmed_seconds:number;planned_seconds:number;verified:boolean;started_at:string; }
const sections=['Activity','Goals','Together','History'] as const;
export function StudyAnalyticsDetails({data}:{data:FocusStatistics}) {
 const [section,setSection]=useState<typeof sections[number]>('Activity');
 const [scale,setScale]=useState<'Daily'|'Weekly'|'Monthly'>('Daily');
 const [selectedDay,setSelectedDay]=useState<number|null>(null);
 const [page,setPage]=useState(0),[revision,setRevision]=useState(0);
 const [history,setHistory]=useState<{content:Entry[];totalPages:number}|null>(null);
 const [error,setError]=useState(false);
 const from=data.daily[0]?.date,to=data.daily.at(-1)?.date;
 useEffect(()=>{
   if(section!=='History')return;
   const controller=new AbortController();
   void apiClient.get('/api/study/history',{params:{from,to,page},signal:controller.signal}).then(response=>{if(!controller.signal.aborted){setHistory(response.data);setError(false);}}).catch(()=>{if(!controller.signal.aborted)setError(true);});
   return ()=>controller.abort();
 },[from,to,page,data,section,revision]);
 const bars=scale==='Daily'?data.daily.map(item=>({label:item.date,value:item.minutes})):data[scale==='Weekly'?'weekly':'monthly'].map(item=>({label:item.date,value:item.hours*60}));
 const maxGoal=Math.max(0,...data.byGoal.map(item=>item.minutes));
 const day=selectedDay===null?null:data.activity[selectedDay];
 return <View style={styles.stack}>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:6}}>{sections.map(item=><Pressable key={item} accessibilityRole="button" accessibilityState={{selected:section===item}} onPress={()=>setSection(item)} style={[styles.tab,section===item&&styles.selected]}><Text style={[styles.tabText,section===item&&styles.selectedText]}>{item}</Text></Pressable>)}</ScrollView>
  {section==='Activity'&&<>
   <View style={styles.metrics}><MetricCard label="Active days" value={data.activeDays} detail={`Last ${data.days} days`}/><MetricCard label="Focus streak" value={`${data.studyStreak} days`} detail={`Best ${data.bestStudyStreak} · separate from Daily Records`}/></View>
   <View style={styles.panel}><Text style={styles.heading}>Completion rate</Text><Text style={styles.large}>{data.completionPercent===null?'—':`${data.completionPercent.toFixed(0)}%`}</Text><View style={styles.track}><View style={[styles.fill,{width:`${barPercent(data.completionPercent??0,100)}%`}]}/></View><Text style={styles.caption}>Completed / verified attempts started in this period</Text></View>
   <View style={styles.panel}><View style={styles.row}>{(['Daily','Weekly','Monthly'] as const).map(item=><Pressable key={item} accessibilityRole="button" accessibilityState={{selected:scale===item}} onPress={()=>setScale(item)} style={[styles.tab,scale===item&&styles.selected]}><Text style={[styles.tabText,scale===item&&styles.selectedText]}>{item}</Text></Pressable>)}</View><BarChart key={scale} items={bars} label={`${scale} study time`}/><Text style={styles.caption}>Only the selected {data.days} days. Boundary weeks/months may be partial. Dates use completion in {data.timeZone}.</Text></View>
   <View style={styles.panel}><Text style={styles.heading}>A year of showing up</Text><Text style={styles.caption}>365 days · Monday at the top · swipe through weeks</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator><View style={{height:336,flexDirection:'column',flexWrap:'wrap',gap:4}}>
     {Array.from({length:calendarPadding(data.activity[0]?.date)},(_,i)=><View key={`pad-${i}`} style={{width:44,height:44}}/>)}
     {data.activity.map((item,index)=><Pressable key={item.date} accessibilityRole="button" accessibilityLabel={`${item.date}: ${item.minutes} minutes, ${item.sessions} sessions`} onPress={()=>setSelectedDay(index)} style={{width:44,height:44,borderRadius:4,backgroundColor:activityColor(item.minutes)}}/>)}
    </View></ScrollView>
    <Text accessibilityLiveRegion="polite" style={styles.caption}>{day?`${day.date} · ${day.minutes} min · ${day.sessions} sessions`:'Tap a date for its recorded activity.'}</Text><Text style={styles.caption}>Intensity: 0 · 1–29 · 30–59 · 60+ min</Text>
   </View>
   <View style={styles.panel}><BarChart items={data.hourly.map(item=>({label:`${item.hour}:00`,value:item.hours*60}))} label="When sessions finish"/><Text style={styles.caption}>Local completion hour, not minute-by-minute attendance.</Text></View>
  </>}
  {section==='Goals'&&<View style={styles.panel}><Text style={styles.heading}>Where your time goes</Text><Text style={styles.caption}>All-time recorded time · includes historical estimates</Text>
   {data.byGoal.length===0?<Text style={styles.caption}>Your first completed linked session will appear here.</Text>:data.byGoal.map((goal,index)=><Pressable key={`${goal.goalId}-${index}`} accessibilityRole={goal.goalId===null?'text':'button'} disabled={goal.goalId===null} onPress={()=>goal.goalId!==null&&router.push({pathname:'/(app)/goals/[goalId]',params:{goalId:String(goal.goalId)}})} style={{gap:10,paddingVertical:12}}>
    <Text style={styles.heading}>{goal.topic}{goal.goalId===null?' · deleted':' ›'}</Text><Text style={styles.caption}>{goal.minutes} min · {goal.sessions} sessions</Text><View style={styles.track}><View style={[styles.fill,{width:`${barPercent(goal.minutes,maxGoal)}%`}]}/></View>
   </Pressable>)}
  </View>}
  {section==='Together'&&<>
   <View style={styles.metrics}><MetricCard label="Individual" value={`${data.individualMinutes} min`} detail="Period · includes historical estimates"/><MetricCard label="Group" value={`${data.groupMinutes} min`} detail={`${data.groupSessions} completed group sessions`}/></View>
   <View style={styles.panel}><Text style={styles.heading}>Your study balance</Text><View accessible accessibilityLabel={`Individual ${data.individualMinutes} minutes, group ${data.groupMinutes} minutes`} style={[styles.track,{height:20,flexDirection:'row'}]}><View style={{height:20,width:`${barPercent(data.individualMinutes,data.periodMinutes)}%`,backgroundColor:palette.primary}}/><View style={{height:20,width:`${barPercent(data.groupMinutes,data.periodMinutes)}%`,backgroundColor:'#bae6fd'}}/></View><Text style={styles.caption}>Mint: individual · light blue: group. Only saved time appears here.</Text></View>
   <View style={styles.panel}><BarChart items={[{label:'Previous',value:data.previousMinutes},{label:'Current',value:data.periodMinutes}]} label={`Two ${data.days}-day periods`}/><Text style={styles.caption}>{data.changePercent===null?'No prior baseline for percentage comparison.':`${data.changePercent>0?'+':''}${data.changePercent.toFixed(1)}% compared with the previous period.`}</Text></View>
  </>}
  {section==='History'&&<>
   <Text style={styles.heading}>Session history</Text><Text style={styles.caption}>Starts in {from} – {to} · {data.timeZone}</Text>
   {error?<View style={styles.panel}><Text accessibilityRole="alert" style={styles.caption}>History unavailable. Your saved sessions have not changed.</Text><ActionButton secondary title="Retry history" onPress={()=>{setError(false);setHistory(null);setRevision(n=>n+1);}}/></View>:!history?<Text style={styles.caption}>Loading saved sessions…</Text>:history.content.length===0?<Text style={styles.caption}>No attempts on this page in the selected period.</Text>:history.content.map(item=><View key={item.id} style={styles.panel}>
    <Text style={styles.heading}>{item.goal_name}</Text><Text style={styles.caption}>{sessionDate(item.started_at,data.timeZone)}</Text><Text style={styles.badge}>{item.state} · {item.source}</Text><Text style={styles.large}>{item.confirmed_seconds/60} min</Text><Text style={styles.caption}>Saved / {item.planned_seconds/60} min planned</Text><Text style={styles.caption}>{item.verified?'Server observed':'Historical estimate'} · Saved on server</Text>
   </View>)}
   <View style={styles.row}><ActionButton secondary title="Previous" disabled={page===0} onPress={()=>{setHistory(null);setPage(n=>n-1);}}/><Text style={styles.caption}>Page {page+1}{history?` / ${Math.max(1,history.totalPages)}`:''}</Text><ActionButton secondary title="Next" disabled={!history||page+1>=history.totalPages} onPress={()=>{setHistory(null);setPage(n=>n+1);}}/></View>
  </>}
 </View>;
}
const styles=StyleSheet.create({
 stack:{gap:20},panel:{padding:16,borderRadius:16,backgroundColor:palette.surface,borderWidth:1,borderColor:palette.border,gap:14},row:{flexDirection:'row',flexWrap:'wrap',gap:8,alignItems:'center'},metrics:{flexDirection:'row',flexWrap:'wrap',gap:10},heading:{color:palette.text,fontSize:18,fontWeight:'700'},caption:{color:palette.muted,fontSize:13,lineHeight:20},large:{color:palette.text,fontSize:30,fontWeight:'700',fontVariant:['tabular-nums']},tab:{minHeight:48,paddingHorizontal:14,paddingVertical:14,borderRadius:12,backgroundColor:palette.surfaceRaised},selected:{backgroundColor:palette.primary},tabText:{color:palette.text,fontWeight:'600',fontSize:14},selectedText:{color:palette.primaryText},track:{height:10,borderRadius:8,overflow:'hidden',backgroundColor:palette.surfaceRaised},fill:{height:10,backgroundColor:palette.primary,borderRadius:8},badge:{color:palette.primary,fontSize:13,fontWeight:'600'},
});
