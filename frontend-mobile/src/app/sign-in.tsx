import { useState } from 'react';
import { Link, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/ui/Screen';
import { FormField } from '../components/ui/FormField';
import { ActionButton } from '../components/ui/ActionButton';
import { StatusMessage } from '../components/ui/StatusMessage';
import { useAuth } from '../hooks/useAuth';
import { getApiErrorMessage } from '../utils/apiError';
import { palette } from '../constants/palette';

export default function SignIn() {
  const { signIn, isLoading, sessionRestoreError, retrySession } = useAuth();
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
    <Screen>
      <View style={styles.heading}>
        <Text style={styles.brand}>STUDYSTREAK</Text>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.description}>Continue building consistent study habits.</Text>
      </View>
      <View style={styles.card}>
        <FormField label="Username" placeholder="Your username" value={username} onChangeText={setUsername}
          autoCapitalize="none" autoCorrect={false} autoComplete="username" editable={!busy} />
        <FormField label="Password" placeholder="Your password" value={password} onChangeText={setPassword}
          secureTextEntry autoComplete="current-password" editable={!busy} />
        {registered === '1' ? <StatusMessage message="Account created. Sign in to continue." /> : null}
        {error ? <StatusMessage error message={error} /> : null}
        {sessionRestoreError ? (
          <View style={styles.recovery}>
            <StatusMessage error message="Cannot restore your previous session. Check your connection and retry, or sign in again." />
            <ActionButton title="Retry previous session" onPress={() => { void retrySession(); }} busy={isLoading} />
          </View>
        ) : null}
        <ActionButton title="Sign in" onPress={() => { void submit(); }} busy={busy} />
      </View>
      <Text style={styles.footer}>New to StudyStreak? <Link href="/sign-up" style={styles.link}>Create an account</Link></Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { gap: 12, marginTop: 40, marginBottom: 14 },
  brand: { color: palette.primary, fontSize: 13, letterSpacing: 2, fontWeight: '800' },
  title: { color: palette.text, fontSize: 34, fontWeight: '800' },
  description: { color: palette.muted, fontSize: 15, lineHeight: 23 },
  card: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border,
    padding: 20, borderRadius: 18, gap: 18 },
  recovery: { gap: 10 },
  footer: { textAlign: 'center', color: palette.muted, lineHeight: 22 },
  link: { color: palette.primary, fontWeight: '700' },
});
