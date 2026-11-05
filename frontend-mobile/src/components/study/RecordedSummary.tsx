import { StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '../ui/ActionButton';
import { palette } from '../../constants/palette';
export function RecordedSummary({minutes,sessions,error=false,pending,onRefresh,updatedAt}:{minutes?:number;sessions?:number;error?:boolean;pending?:number;onRefresh?:()=>void;updatedAt?:number}) {
 return <View style={styles.panel}><Text style={styles.label}>RECORDED FOR THIS GOAL</Text><View style={styles.row}><View style={styles.metric}><Text style={styles.value}>{minutes??'—'}</Text><Text style={styles.caption}>confirmed minutes</Text></View><View style={styles.metric}><Text style={styles.value}>{sessions??'—'}</Text><Text style={styles.caption}>completed sessions</Text></View></View>
  <Text accessibilityLiveRegion="polite" style={[styles.caption,error&&{color:palette.pending}]}>{error?(minutes===undefined?'Totals unavailable · retry to confirm':'Update failed · showing last confirmed totals'):minutes===undefined?'Loading recorded totals…':'Server-confirmed snapshot · all time'}</Text>
  {updatedAt&&!error&&<Text style={styles.caption}>Retrieved at {new Date(updatedAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</Text>}
  {pending!==undefined&&<Text style={[styles.caption,pending>0&&{color:palette.pending}]}>{pending>0?`${pending} pending on this device · excluded from totals`:'No pending completions in this view'}</Text>}
  {onRefresh&&<ActionButton secondary title="Refresh recorded totals" onPress={onRefresh}/>}
 </View>;
}
const styles=StyleSheet.create({panel:{backgroundColor:palette.background,borderWidth:1,borderColor:'#365b4b',borderRadius:16,padding:16,gap:14},label:{color:palette.primary,fontSize:12,fontWeight:'700',letterSpacing:1},row:{flexDirection:'row',flexWrap:'wrap',gap:14},metric:{flex:1,minWidth:90,gap:6},value:{color:palette.text,fontSize:36,fontWeight:'700',fontVariant:['tabular-nums']},caption:{color:palette.muted,fontSize:13,lineHeight:20}});
