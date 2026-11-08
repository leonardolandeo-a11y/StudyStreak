import { useState } from 'react';
import { Link, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/ui/Screen';
import { FormField } from '../components/ui/FormField';
import { ActionButton } from '../components/ui/ActionButton';
import { StatusMessage } from '../components/ui/StatusMessage';
import { useAuth } from '../hooks/useAuth';
import { getApiErrorMessage } from '../utils/apiError';
import { useThemedStyles } from '../hooks/useAppearance';
import type { ThemeColors } from '../features/appearance/theme';
import { Card } from '../components/ui/Card';
import { PageHeading } from '../components/ui/PageHeading';

export default function SignIn() {
  const { signIn, isLoading, sessionRestoreError, retrySession } = useAuth();
  const styles = useThemedStyles(createStyles);
  const { registered } = useLocalSearchParams<{ registered?: string }>();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required.'); return;
    }
    setBusy(true); setError(null);
    try {
      await signIn(username.trim(), password);
      // Stack.Protected navigates to the authenticated area.
    } catch (cause) {
      setError(getApiErrorMessage(cause, 'Unable to sign in. Check your credentials.'));
    } finally { setBusy(false); }
  }

  return (
    <Screen themed>
      <PageHeading eyebrow="STUDYSTREAK" title="Welcome back" description="Continue building consistent study habits." />
      <Card style={styles.card}>
        <FormField label="Username" placeholder="Your username" value={username} onChangeText={setUsername}
          autoCapitalize="none" autoCorrect={false} autoComplete="username" editable={!busy} />
        <FormField label="Password" placeholder="Your password" value={password} onChangeText={setPassword}
          secureTextEntry autoComplete="current-password" editable={!busy} />
        {registered === '1' ? <StatusMessage variant="success" message="Account created. Sign in to continue." /> : null}
        {error ? <StatusMessage error message={error} /> : null}
        {sessionRestoreError ? (
          <View style={styles.recovery}>
            <StatusMessage error message="Cannot restore your previous session. Check your connection and retry, or sign in again." />
            <ActionButton title="Retry previous session" onPress={() => { void retrySession(); }} busy={isLoading} />
          </View>
        ) : null}
        <ActionButton title="Sign in" onPress={() => { void submit(); }} busy={busy} />
      </Card>
      <Text style={styles.footer}>New to StudyStreak? <Link href="/sign-up" style={styles.link}>Create an account</Link></Text>
    </Screen>
  );
}

const createStyles = (palette: ThemeColors) => StyleSheet.create({
  card: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border,
    padding: 20, borderRadius: 18, gap: 18 },
  recovery: { gap: 10 },
  footer: { textAlign: 'center', color: palette.muted, lineHeight: 22 },
  link: { color: palette.primary, fontWeight: '700' },
});
