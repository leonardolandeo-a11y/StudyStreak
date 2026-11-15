import { StudyBrand } from '../branding/StudyBrand';
import { NavigationPressable } from './NavigationPressable';
import { router } from 'expo-router';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppearance } from '../../hooks/useAppearance';
import { useAuth } from '../../hooks/useAuth';
import { useNavigationData } from '../../contexts/NavigationDataContext';
import { drawerItems } from '../../features/navigation/menu';
import { OwnAvatar } from './OwnAvatar';
import { SidebarSkyline } from './SidebarSkyline';
import { AppIcon, type IconName } from '../ui/AppIcon';
import { useState } from 'react';

export function StudyDrawerContent({ active, close, navigate }: {
  active: string; close(): void; navigate(name: string): void;
}) {
  const { theme } = useAppearance();
  const { currentUser, signOut } = useAuth();
  const [signingOut,setSigningOut]=useState(false),[signOutError,setSignOutError]=useState(false);
  const { profile, avatar, unread } = useNavigationData();
  const name = profile?.presentationName || currentUser?.username || 'StudyStreak';
  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }}>
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 12, gap: 4 }}>
      <View style={{ alignItems: 'flex-end' }}><NavigationPressable accessibilityRole="button" accessibilityLabel="Close menu"
        onPress={close} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>
        <AppIcon name="close" color={theme.colors.muted} size={20} />
      </NavigationPressable></View>
      <View testID="drawer-identity" style={{alignItems:'center',paddingHorizontal:36,paddingBottom:24,marginBottom:20,borderBottomWidth:1,borderColor:theme.colors.border}}>
        <NavigationPressable accessibilityRole="button" accessibilityLabel={`Open your profile, ${name}`} onPress={() => {
          close(); router.push('/(app)/profile');
        }} style={{width:'100%',alignItems:'center',gap:8}}>
          <OwnAvatar uri={avatar} name={name} size={80} />
          <Text numberOfLines={2} style={{color:theme.colors.text,fontSize:18,fontWeight:'700',textAlign:'center'}}>{name}</Text>
          <Text numberOfLines={2} style={{color:theme.colors.muted,fontSize:13,textAlign:'center'}}>@{profile?.username || currentUser?.username}</Text>
        </NavigationPressable>
        <NavigationPressable accessibilityRole="button" accessibilityLabel="Settings" onPress={() => {
          close(); router.push('/(app)/settings',{withAnchor:true});
        }} style={{position:'absolute',right:0,top:16,width:48,height:48,alignItems:'center',justifyContent:'center',borderRadius:10}}>
          <AppIcon name="settings" color={theme.colors.muted} size={24} />
        </NavigationPressable>
      </View>
      {drawerItems.map((item, index) => <DrawerRow key={item.name} label={item.label}
        icon={(['menu', 'dashboard', 'focus', 'resources', 'notifications'] as const)[index]}
        selected={active === item.name} unread={item.name === 'notifications/index' ? unread : null}
        onPress={() => { navigate(item.name); close(); }} />)}
      <View style={{ flex: 1, minHeight: 20 }} />
      <SidebarSkyline/>
      <View testID="drawer-brand-actions" style={{paddingVertical:12,flexDirection:'row',alignItems:'center',gap:4}}>
        <View style={{flex:1,minWidth:0}}><StudyBrand interactive/></View>
        <NavigationPressable accessibilityRole="button" accessibilityLabel="Sign out" accessibilityState={{busy:signingOut,disabled:signingOut}} disabled={signingOut}
          onPress={()=>{setSigningOut(true);setSignOutError(false);void signOut().catch(()=>setSignOutError(true)).finally(()=>setSigningOut(false));}}
          style={{width:44,height:48,alignItems:'center',justifyContent:'center',borderRadius:8}}>
          {signingOut ? <ActivityIndicator color={theme.colors.error}/> : <AppIcon name="sign-out" color={theme.colors.error} size={24}/>}
        </NavigationPressable>
      </View>
      {signOutError ? <Text accessibilityRole="alert" style={{color:theme.colors.error}}>Could not sign out. Please retry.</Text> : null}
    </ScrollView>
  </SafeAreaView>;
}

function DrawerRow({ label, icon, selected, unread, onPress }: {
  label: string; icon: IconName; selected: boolean; unread: number | null; onPress(): void;
}) {
  const { theme } = useAppearance();
  const [pulse, setPulse] = useState(0);
  const showBadge = unread !== null && Number.isSafeInteger(unread) && unread > 0;
  const color = selected ? theme.colors.primary : theme.colors.textSecondary;
  return <NavigationPressable accessibilityRole="button" accessibilityLabel={label}
    accessibilityHint={showBadge ? `${unread} unread notifications` : undefined} accessibilityState={{ selected }} aria-selected={selected}
    onPressIn={() => setPulse(value => value + 1)} onPress={onPress}
    style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 52,
      paddingHorizontal: 10, borderRadius: 10, backgroundColor: selected || pressed ? theme.colors.primarySoft : 'transparent' })}>
    <View style={{ width: 28, height: 28 }}>
      <AppIcon name={icon} color={color} size={26} pulse={pulse} />
      {showBadge ? <View testID="unread-badge" style={{ position: 'absolute', right: -7, top: -7, minWidth: 17,
        height: 17, paddingHorizontal: 3, borderRadius: 9, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' }}>
        <Text accessible={false} style={{ color: theme.colors.primaryText, fontSize: 10, fontWeight: '700' }}>{unread > 99 ? '99+' : unread}</Text>
      </View> : null}
    </View>
    <Text style={{flex:1,color,fontSize:16,fontWeight:selected?'600':'500'}}>{label}</Text>
    {selected ? <Text testID="drawer-selected-star" accessible={false} importantForAccessibility="no-hide-descendants" style={{color:theme.colors.primary,fontSize:20}}>✦</Text> : null}
  </NavigationPressable>;
}
