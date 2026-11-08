import { router, Stack } from 'expo-router';
import { useAppearance } from '../../hooks/useAppearance';
import { SettingsLink } from '../../components/navigation/SettingsLink';
import { ActionButton } from '../../components/ui/ActionButton';

export default function AuthenticatedLayout() {
  const { theme, reduceMotion } = useAppearance();
  return <Stack screenOptions={{ headerShown: true, headerStyle: { backgroundColor: theme.colors.surface },
    headerTintColor: theme.colors.text, headerTitleStyle: { fontWeight: '700' }, headerShadowVisible: false,
    contentStyle: { backgroundColor: theme.colors.background }, headerBackButtonDisplayMode: 'minimal',
    animation: reduceMotion ? 'none' : 'default', headerRight: () => <SettingsLink /> }}>
    <Stack.Screen name="home" options={{ title: 'StudyStreak', headerBackVisible: false }} />
    <Stack.Screen name="settings" options={({ navigation }) => ({ title: 'Settings',
      headerLeft: navigation.canGoBack() ? undefined : () =>
        <ActionButton title="Home" secondary onPress={() => router.replace('/(app)/home')} /> })} />
    <Stack.Screen name="goals/index" options={{ title: 'Goals' }} />
    <Stack.Screen name="goals/[goalId]" options={{ title: 'Goal details' }} />
    <Stack.Screen name="goals/[goalId]/records/[recordId]" options={{ title: 'Daily record' }} />
    <Stack.Screen name="focus-studio" options={{ title: 'Focus Studio' }} />
    <Stack.Screen name="study-rooms" options={{ title: 'Study Rooms' }} />
    <Stack.Screen name="resources/index" options={{ title: 'Resources' }} />
    <Stack.Screen name="tracking/index" options={{ title: 'Tracking Links' }} />
    <Stack.Screen name="validations/index" options={{ title: 'Validations' }} />
    <Stack.Screen name="notifications/index" options={{ title: 'Notifications' }} />
    <Stack.Screen name="camera" options={{ title: 'Photo evidence' }} />
    <Stack.Screen name="voice" options={{ title: 'Voice evidence' }} />
  </Stack>;
}
