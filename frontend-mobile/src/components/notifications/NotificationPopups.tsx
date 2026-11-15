import { useEffect, useRef, useState } from 'react';
import { Animated, AppState, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAppearance } from '../../hooks/useAppearance';
import type { Notification } from '../../types/notification';
import { notificationTypeLabels } from '../../types/notification';
import { notificationService } from '../../services/notificationService';
import { getSessionRevision } from '../../services/authSession';
import { notificationRoute } from '../../features/notifications/notificationRoute';
import { NavigationPressable } from '../navigation/NavigationPressable';
import { AppIcon } from '../ui/AppIcon';
export function NotificationPopups({ userId, notifications, dismiss, refresh }: { userId: number; notifications: Notification[]; dismiss(id:number): void; refresh(): Promise<void> }) {
  const { theme:{colors} } = useAppearance();
  const insets=useSafeAreaInsets(),{width,height}=useWindowDimensions();
  const [active,setActive]=useState(AppState.currentState==='active');
  const [busy,setBusy]=useState<number|null>(null),[error,setError]=useState<string|null>(null);
  const mounted=useRef(true);
  useEffect(()=>{mounted.current=true;const sub=AppState.addEventListener('change',state=>setActive(state==='active'));return()=>{mounted.current=false;sub.remove();};},[]);
  async function open(notification:Notification) {
    if(busy!==null)return;
    const revision=getSessionRevision();setBusy(notification.id);setError(null);
    try {
      if(!notification.read)await notificationService.markRead(userId,notification.id);
      if(!mounted.current||revision!==getSessionRevision())return;
      void refresh();dismiss(notification.id);router.push(notificationRoute(notification));
    }catch{if(mounted.current&&revision===getSessionRevision())setError('Could not open this notification. Please retry.');}
    finally{if(mounted.current&&revision===getSessionRevision())setBusy(null);}
  }
  if(!active||!notifications.length)return null;
  return <View testID="notification-popups" pointerEvents="box-none" style={{position:'absolute',zIndex:100,bottom:insets.bottom+76,right:insets.right+12,left:width<600?insets.left+12:undefined,width:width<600?undefined:360}}>
    <ScrollView keyboardShouldPersistTaps="handled" style={{maxHeight:Math.max(44,Math.min(width<600?160:280,height-insets.top-insets.bottom-140))}} contentContainerStyle={{gap:8}}>
      {notifications.slice(-3).map(notification=><Popup key={notification.id} notification={notification} busy={busy!==null} open={()=>{void open(notification);}} dismiss={()=>dismiss(notification.id)}/>)}
      {error ? <Text accessibilityRole="alert" style={{backgroundColor:colors.errorSurface,color:colors.error,padding:8}}>{error}</Text> : null}
    </ScrollView>
  </View>;
}
function Popup({notification,busy,open,dismiss}:{notification:Notification;busy:boolean;open():void;dismiss():void}) {
  const {theme:{colors},reduceMotion}=useAppearance();const [opacity]=useState(()=>new Animated.Value(reduceMotion?1:0));
  useEffect(()=>{if(reduceMotion){opacity.setValue(1);return;}const animation=Animated.timing(opacity,{toValue:1,duration:220,useNativeDriver:true,isInteraction:false});animation.start();return()=>animation.stop();},[opacity,reduceMotion]);
  return <Animated.View testID={`notification-popup-${notification.id}`} accessibilityLiveRegion="polite" style={{opacity,flexDirection:'row',alignItems:'flex-start',borderRadius:10,borderWidth:1,borderColor:colors.borderStrong,backgroundColor:colors.surfaceRaised,padding:10,gap:6,elevation:4,shadowColor:colors.shadow,shadowOpacity:.12,shadowRadius:4}}>
    <NavigationPressable accessibilityRole="button" accessibilityLabel={`Open notification ${notification.id}`} disabled={busy} onPress={open} style={{flex:1,minHeight:44,gap:4,justifyContent:'center'}}>
      <Text style={{color:colors.primary,fontSize:13,fontWeight:'700'}}>{notificationTypeLabels[notification.type]??'Notification'}</Text>
      <Text numberOfLines={2} style={{color:colors.text,fontSize:13,lineHeight:18}}>{notification.message}</Text>
    </NavigationPressable>
    <NavigationPressable accessibilityRole="button" accessibilityLabel={`Dismiss notification ${notification.id}`} onPress={dismiss} style={{minWidth:44,minHeight:44,alignItems:'center',justifyContent:'center'}}><AppIcon name="close" color={colors.muted} size={18}/></NavigationPressable>
  </Animated.View>;
}
