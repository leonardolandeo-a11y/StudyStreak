import { useEffect, useState } from 'react';
import { Text, View, Pressable } from 'react-native';
import { apiClient } from '../../services/apiClient';
import type { FocusStatistics } from '../../features/focus/focusStatisticsService';
interface Entry { id:string;goal_name:string;source:string;state:string;confirmed_seconds:number;planned_seconds:number;verified:boolean; }
export function StudyAnalyticsDetails({data}:{data:FocusStatistics}) {
 const [page,setPage]=useState(0);
 const [history,setHistory]=useState<{content:Entry[];totalPages:number}|null>(null);
 const [error,setError]=useState(false);
 const from=data.daily[0]?.date,to=data.daily.at(-1)?.date;
 useEffect(()=>{
   const controller=new AbortController();
   void apiClient.get('/api/study/history',{params:{from,to,page},signal:controller.signal}).then(response=>{if(!controller.signal.aborted){setHistory(response.data);setError(false);}}).catch(()=>{if(!controller.signal.aborted)setError(true);});
   return ()=>controller.abort();
 },[from,to,page,data]);
 const text={color:'#cbd5e1',fontSize:13};
 return <View style={{gap:12}}>
  <Text style={text}>Verified: {data.verifiedMinutes} min · Historical estimates: {data.estimatedMinutes} min · {data.timeZone}</Text>
  <Text style={text}>Individual: {data.individualMinutes} min · Group: {data.groupMinutes} min / {data.groupSessions} sessions</Text>
  <Text style={text}>Previous period: {data.previousMinutes} min · Change: {data.changePercent===null?'No prior baseline':`${data.changePercent.toFixed(1)}%`}</Text>
  <Text style={text}>Completion: {data.completionPercent===null?'No verified attempts':`${data.completionPercent.toFixed(1)}%`} · Average: {data.averageMinutes.toFixed(1)} min</Text>
  <Text style={text}>{data.activeDays} active days · Study streak: {data.studyStreak} days (best {data.bestStudyStreak}). Independent of Daily Records.</Text>
  <Text style={text}>This week: {(data.weekMinutes/60).toFixed(2)} hours</Text>
  <Text style={text}>Activity · last 365 days</Text>
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:3}}>{data.activity.map(day=><View key={day.date} accessible accessibilityLabel={`${day.date}: ${day.minutes} minutes`} style={{height:12,width:12,backgroundColor:day.minutes===0?'#253242':day.minutes<30?'#166534':day.minutes<60?'#16a34a':'#86efac'}}/>)}</View>
  <Text style={text}>Hours per day</Text>
  <Text style={text}>{data.daily.map(day=>`${day.date}: ${(day.minutes/60).toFixed(2)} h`).join(' · ')}</Text>
  <Text style={text}>Weeks: {data.weekly.map(item=>`${item.date}: ${item.hours.toFixed(2)} h`).join(' · ')}</Text>
  <Text style={text}>Months: {data.monthly.map(item=>`${item.date}: ${item.hours.toFixed(2)} h`).join(' · ')}</Text>
  <Text style={text}>Completion time: {data.hourly.filter(item=>item.hours>0).map(item=>`${item.hour}:00 ${item.hours.toFixed(1)} h`).join(' · ')||'No completed sessions'}</Text>
  <Text style={text}>Session history · selected period</Text>
  {error?<Text accessibilityRole="alert" style={text}>History unavailable</Text>:!history?<Text style={text}>Loading history…</Text>:history.content.length===0?<Text style={text}>No attempts</Text>:history.content.map(item=><Text key={item.id} style={text}>{item.goal_name} · {item.source} · {item.state} · {item.confirmed_seconds/60} recorded / {item.planned_seconds/60} planned min · {item.verified?'Server observed':'Historical estimate'}</Text>)}
  <View style={{flexDirection:'row',gap:24}}><Pressable accessibilityRole="button" disabled={page===0} onPress={()=>{setHistory(null);setPage(value=>value-1);}}><Text style={text}>Previous</Text></Pressable><Text style={text}>Page {page+1}</Text><Pressable accessibilityRole="button" disabled={!history||page+1>=history.totalPages} onPress={()=>{setHistory(null);setPage(value=>value+1);}}><Text style={text}>Next</Text></Pressable></View>
 </View>;
}
