import { NavigationPressable } from './NavigationPressable';
import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppearance } from '../../hooks/useAppearance';
import { useAuth } from '../../hooks/useAuth';
import { useNavigationData } from '../../contexts/NavigationDataContext';
import { drawerItems } from '../../features/navigation/menu';
import { OwnAvatar } from './OwnAvatar';
import { ActionButton } from '../ui/ActionButton';

export function StudyDrawerContent({ active, close, navigate }: {
  active: string; close(): void; navigate(name: string): void;
}) {
  const { theme } = useAppearance();
  const { currentUser } = useAuth();
  const { profile, avatar, unread } = useNavigationData();
  const name = profile?.presentationName || currentUser?.username || 'StudyStreak';
  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }}>
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16, gap: 12 }}>
      <ActionButton title="Close menu" secondary onPress={close} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 12 }}>
        <NavigationPressable accessibilityRole="button" accessibilityLabel={`Open your profile, ${name}`} onPress={() => {
          close(); router.push('/(app)/profile');
        }} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', minHeight: 52, gap: 10 }}>
          <OwnAvatar uri={avatar} name={name} />
          <Text numberOfLines={2} style={{ flex: 1, color: theme.colors.text, fontSize: 16, fontWeight: '700' }}>{name}</Text>
        </NavigationPressable>
        <NavigationPressable accessibilityRole="button" accessibilityLabel="Settings" onPress={() => {
          close(); router.push('/(app)/settings');
        }} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primarySoft, borderRadius: 12 }}>
          <Text accessible={false} style={{ color: theme.colors.primary, fontSize: 24 }}>⚙</Text>
        </NavigationPressable>
      </View>
      {drawerItems.map(item => <ActionButton key={item.name}
        title={item.name === 'notifications/index' && unread !== null ? `Notifications (${unread} unread)` : item.label}
        secondary selected={active === item.name} onPress={() => { navigate(item.name); close(); }} />)}
      <View style={{ flex: 1, minHeight: 20 }} />
      <Text style={{ color: theme.colors.primary, fontSize: 20, fontWeight: '800', letterSpacing: 1 }}>◎ StudyStreak</Text>
      <Text style={{ color: theme.colors.muted, fontSize: 12 }}>Build your study rhythm.</Text>
    </ScrollView>
  </SafeAreaView>;
}
