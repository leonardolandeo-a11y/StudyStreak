import type { ReactNode } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAppearance, useThemedStyles } from '../../hooks/useAppearance';
import { useAuth } from '../../hooks/useAuth';
import { useSocialMember } from '../../contexts/SocialContext';
import type { ThemeColors } from '../../features/appearance/theme';
import { SocialAvatar } from '../social/MemberReference';
import { NavigationPressable } from '../navigation/NavigationPressable';
export function ParticipantCard({userId,name,host,online,studying,children}:{userId?:number;name:string;host:boolean;online:boolean;studying:boolean;children?:ReactNode}) {
 const styles = useThemedStyles(createStyles);
 return <View style={styles.row}><View style={{flex:1,gap:6}}>
  {userId ? <ParticipantIdentity userId={userId} name={name}/> : <Text style={styles.name}>{name}</Text>}
  <Text style={styles.detail}>{host?'Host':'Member'} · {online?'Connected to room':'Disconnected from room'}</Text>
  <Text style={[styles.detail,online&&studying&&styles.studying]}>{online&&studying?'Studying':!online&&studying?'Study status paused · offline':'Not studying'}</Text>
 </View>{children}</View>;
}
function ParticipantIdentity({userId,name}:{userId:number;name:string}) {
 const {theme:{colors}}=useAppearance(),{currentUser}=useAuth(),{accepted}=useSocialMember(userId);
 const identity=<><SocialAvatar userId={userId} name={name} size={40}/><Text style={{flex:1,color:colors.text,fontSize:15,fontWeight:'600'}}>{name}</Text></>;
 if(userId!==currentUser?.id&&!accepted)return <View style={{flexDirection:'row',alignItems:'center',gap:10}}>{identity}</View>;
 return <NavigationPressable accessibilityRole="button" accessibilityLabel={`View profile of ${name}`} style={{flexDirection:'row',alignItems:'center',gap:10,minHeight:44}}
  onPress={()=>userId===currentUser?.id?router.push('/(app)/profile'):router.push({pathname:'/(app)/users/[userId]/profile',params:{userId:String(userId)}})}>{identity}</NavigationPressable>;
}
const createStyles=(palette:ThemeColors)=>StyleSheet.create({studying:{color:palette.primary},row:{flexDirection:'row',alignItems:'flex-start',gap:10,paddingVertical:12,borderBottomWidth:1,borderColor:palette.border},name:{color:palette.text,fontSize:15,fontWeight:'600'},detail:{color:palette.muted,fontSize:12,lineHeight:18}});
