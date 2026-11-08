import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AuthProvider } from '../contexts/AuthProvider';
import { useAuth } from '../hooks/useAuth';
import { AppearanceProvider } from '../contexts/AppearanceProvider';
import { useAppearance } from '../hooks/useAppearance';

function Navigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme, ready, reduceMotion } = useAppearance();
  if (isLoading || !ready) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.colors.background }]}>
        <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
        <ActivityIndicator accessibilityLabel="Loading StudyStreak" size="large" color={theme.colors.primary} />
      </View>
    );
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
    <AppearanceProvider>
      <AuthProvider>
        <Navigator />
      </AuthProvider>
    </AppearanceProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
