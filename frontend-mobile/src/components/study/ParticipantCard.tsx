import type { ReactNode } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useThemedStyles } from '../../hooks/useAppearance';
import type { ThemeColors } from '../../features/appearance/theme';
import { SocialAvatar, MemberProfileLink } from '../social/MemberReference';
export function ParticipantCard({userId,name,host,online,studying,children}:{userId?:number;name:string;host:boolean;online:boolean;studying:boolean;children?:ReactNode}) {
 const styles = useThemedStyles(createStyles);
 return <View style={styles.row}>{userId ? <SocialAvatar userId={userId} name={name} size={44} /> : <View style={styles.avatar}><Text style={styles.initials}>{name.slice(0,2).toUpperCase()}</Text></View>}<View style={{flex:1,gap:6}}><Text style={styles.name}>{name}</Text><Text style={styles.detail}>{host?'Host':'Member'} · {online?'Connected to room':'Disconnected from room'}</Text><Text style={[styles.detail,online&&studying&&styles.studying]}>{online&&studying?'Studying':!online&&studying?'Study status paused · offline':'Not studying'}</Text>{userId ? <MemberProfileLink userId={userId} name={name} /> : null}{children}</View></View>;
}
const createStyles=(palette:ThemeColors)=>StyleSheet.create({studying:{color:palette.primary},row:{flexDirection:'row',alignItems:'flex-start',gap:12,paddingVertical:14,borderBottomWidth:1,borderColor:palette.border},avatar:{width:44,height:44,alignItems:'center',justifyContent:'center',borderRadius:12,backgroundColor:palette.surfaceRaised},initials:{color:palette.primary,fontSize:17,fontWeight:'700'},name:{color:palette.text,fontSize:16,fontWeight:'600'},detail:{color:palette.muted,fontSize:13,lineHeight:20}});
