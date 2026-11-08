import { router, Stack } from 'expo-router';
import { useAppearance } from '../../hooks/useAppearance';
import { SettingsLink } from '../../components/navigation/SettingsLink';
import { ActionButton } from '../../components/ui/ActionButton';
import { NavigationDataProvider } from '../../contexts/NavigationDataContext';
import { useAuth } from '../../hooks/useAuth';
export const unstable_settings = { initialRouteName: '(main)' };

export default function AuthenticatedLayout() {
  const { theme, reduceMotion } = useAppearance();
  const { currentUser } = useAuth();
  if (!currentUser) return null;
  return <NavigationDataProvider key={currentUser.id} userId={currentUser.id}><Stack screenOptions={{ headerShown: true, headerStyle: { backgroundColor: theme.colors.surface },
    headerTintColor: theme.colors.text, headerTitleStyle: { fontWeight: '700' }, headerShadowVisible: false,
    contentStyle: { backgroundColor: theme.colors.background }, headerBackButtonDisplayMode: 'minimal',
    animation: reduceMotion ? 'none' : 'default', headerRight: () => <SettingsLink /> }}>
    <Stack.Screen name="(main)" options={{ headerShown: false }} />
    <Stack.Screen name="home" options={{ headerShown: false }} />
    <Stack.Screen name="profile" options={{ title: 'My profile' }} />
    <Stack.Screen name="settings" options={({ navigation }) => ({ title: 'Settings',
      headerLeft: navigation.canGoBack() ? undefined : () =>
        <ActionButton title="Home" secondary onPress={() => router.replace('/(app)/home')} /> })} />
    <Stack.Screen name="goals/[goalId]" options={{ title: 'Goal details' }} />
    <Stack.Screen name="goals/[goalId]/records/[recordId]" options={{ title: 'Daily record' }} />
    <Stack.Screen name="camera" options={{ title: 'Photo evidence' }} />
    <Stack.Screen name="voice" options={{ title: 'Voice evidence' }} />
  </Stack></NavigationDataProvider>;
}
