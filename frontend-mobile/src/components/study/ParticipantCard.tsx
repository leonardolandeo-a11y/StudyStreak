import type { ReactNode } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { palette } from '../../constants/palette';
export function ParticipantCard({name,host,online,studying,children}:{name:string;host:boolean;online:boolean;studying:boolean;children?:ReactNode}) {
 return <View style={styles.row}><View style={styles.avatar}><Text style={styles.initials}>{name.slice(0,2).toUpperCase()}</Text></View><View style={{flex:1,gap:6}}><Text style={styles.name}>{name}</Text><Text style={styles.detail}>{host?'Host':'Member'} · {online?'Online':'Offline'}</Text><Text style={[styles.detail,online&&studying&&{color:palette.primary}]}>{online&&studying?'Studying':!online&&studying?'Study status paused · offline':'Not studying'}</Text>{children}</View></View>;
}
const styles=StyleSheet.create({row:{flexDirection:'row',alignItems:'flex-start',gap:12,paddingVertical:14,borderBottomWidth:1,borderColor:palette.border},avatar:{width:44,height:44,alignItems:'center',justifyContent:'center',borderRadius:12,backgroundColor:palette.surfaceRaised},initials:{color:palette.primary,fontSize:17,fontWeight:'700'},name:{color:palette.text,fontSize:16,fontWeight:'600'},detail:{color:palette.muted,fontSize:13,lineHeight:20}});
