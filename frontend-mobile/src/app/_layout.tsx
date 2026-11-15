import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../contexts/AuthProvider';
import { useAuth } from '../hooks/useAuth';
import { AppearanceProvider } from '../contexts/AppearanceProvider';
import { useAppearance } from '../hooks/useAppearance';
import { AppLoadingScreen } from '../components/ui/AppLoadingScreen';

function Navigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme, ready, reduceMotion } = useAppearance();
  if (isLoading || !ready) {
    return <><StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} /><AppLoadingScreen /></>;
  }

  return (
    <>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: reduceMotion ? 'none' : 'default',
        contentStyle: { backgroundColor: theme.colors.background } }}>
        <Stack.Screen name="index" />
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="sign-in" />
          <Stack.Screen name="sign-up" />
        </Stack.Protected>
        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppearanceProvider>
        <Navigator />
      </AppearanceProvider>
    </AuthProvider>
  );
}
