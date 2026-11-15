import { Stack } from 'expo-router';
import { useAppearance } from '../../hooks/useAppearance';
import { NavigationDataProvider } from '../../contexts/NavigationDataContext';
import { SocialProvider } from '../../contexts/SocialContext';
import { useAuth } from '../../hooks/useAuth';
export const unstable_settings = { anchor: '(main)' };

export default function AuthenticatedLayout() {
  const { theme, reduceMotion } = useAppearance();
  const { currentUser } = useAuth();
  if (!currentUser) return null;
  return <NavigationDataProvider key={currentUser.id} userId={currentUser.id}><SocialProvider userId={currentUser.id}><Stack screenOptions={{ headerShown: true, headerStyle: { backgroundColor: theme.colors.surface },
    headerTintColor: theme.colors.text, headerTitleStyle: { fontWeight: '700' }, headerShadowVisible: false,
    contentStyle: { backgroundColor: theme.colors.background }, headerBackButtonDisplayMode: 'minimal',
    animation: reduceMotion ? 'none' : 'default' }}>
    <Stack.Screen name="(main)" options={{ headerShown: false }} />
    <Stack.Screen name="home" options={{ headerShown: false }} />
    <Stack.Screen name="profile" options={{ title: 'My profile' }} />
    <Stack.Screen name="users/[userId]/profile" options={{ title: 'Member profile' }} />
    <Stack.Screen name="settings" options={{title:'Settings'}} />
    <Stack.Screen name="goals/[goalId]" options={{ title: 'Goal details' }} />
    <Stack.Screen name="goals/[goalId]/tags" options={{ title: 'Goal tags' }} />
    <Stack.Screen name="goals/[goalId]/records/[recordId]" options={{ title: 'Daily record' }} />
    <Stack.Screen name="camera" options={{ title: 'Photo evidence' }} />
    <Stack.Screen name="voice" options={{ title: 'Voice evidence' }} />
  </Stack></SocialProvider></NavigationDataProvider>;
}
