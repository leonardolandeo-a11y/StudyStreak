import { NavigationPressable } from './NavigationPressable';
import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppearance } from '../../hooks/useAppearance';
import { useAuth } from '../../hooks/useAuth';
import { useNavigationData } from '../../contexts/NavigationDataContext';
import { drawerItems } from '../../features/navigation/menu';
import { OwnAvatar } from './OwnAvatar';
import { AppIcon, type IconName } from '../ui/AppIcon';
import { useState } from 'react';

export function StudyDrawerContent({ active, close, navigate }: {
  active: string; close(): void; navigate(name: string): void;
}) {
  const { theme } = useAppearance();
  const { currentUser } = useAuth();
  const { profile, avatar, unread } = useNavigationData();
  const name = profile?.presentationName || currentUser?.username || 'StudyStreak';
  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }}>
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 12, gap: 4 }}>
      <View style={{ alignItems: 'flex-end' }}><NavigationPressable accessibilityRole="button" accessibilityLabel="Close menu"
        onPress={close} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>
        <AppIcon name="close" color={theme.colors.muted} size={20} />
      </NavigationPressable></View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }}>
        <NavigationPressable accessibilityRole="button" accessibilityLabel={`Open your profile, ${name}`} onPress={() => {
          close(); router.push('/(app)/profile');
        }} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', minHeight: 52, gap: 10 }}>
          <OwnAvatar uri={avatar} name={name} size={40} />
          <Text numberOfLines={2} style={{ flex: 1, color: theme.colors.text, fontSize: 14, fontWeight: '700' }}>{name}</Text>
        </NavigationPressable>
        <NavigationPressable accessibilityRole="button" accessibilityLabel="Settings" onPress={() => {
          close(); router.push('/(app)/settings');
        }} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>
          <AppIcon name="settings" color={theme.colors.muted} size={20} />
        </NavigationPressable>
      </View>
      {drawerItems.map((item, index) => <DrawerRow key={item.name} label={item.label}
        icon={(['menu', 'dashboard', 'focus', 'resources', 'notifications'] as const)[index]}
        selected={active === item.name} unread={item.name === 'notifications/index' ? unread : null}
        onPress={() => { navigate(item.name); close(); }} />)}
      <View style={{ flex: 1, minHeight: 20 }} />
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', padding: 8 }}>
        <AppIcon name="menu" color={theme.colors.primary} />
        <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '800' }}>StudyStreak</Text>
      </View>
      <Text style={{ color: theme.colors.muted, fontSize: 12 }}>Build your study rhythm.</Text>
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
    accessibilityHint={showBadge ? `${unread} unread notifications` : undefined} accessibilityState={{ selected }}
    onPressIn={() => setPulse(value => value + 1)} onPress={onPress}
    style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 48,
      paddingHorizontal: 10, borderRadius: 10, backgroundColor: selected || pressed ? theme.colors.primarySoft : 'transparent' })}>
    <View style={{ width: 24, height: 24 }}>
      <AppIcon name={icon} color={color} pulse={pulse} />
      {showBadge ? <View testID="unread-badge" style={{ position: 'absolute', right: -7, top: -7, minWidth: 17,
        height: 17, paddingHorizontal: 3, borderRadius: 9, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' }}>
        <Text accessible={false} style={{ color: theme.colors.primaryText, fontSize: 10, fontWeight: '700' }}>{unread > 99 ? '99+' : unread}</Text>
      </View> : null}
    </View>
    <Text style={{ color, fontSize: 15, fontWeight: selected ? '600' : '500' }}>{label}</Text>
  </NavigationPressable>;
}
