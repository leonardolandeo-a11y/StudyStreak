import { useState } from 'react';
import { Link, router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { AuthScreen } from '../components/auth/AuthScreen';
import { FormField } from '../components/ui/FormField';
import { ActionButton } from '../components/ui/ActionButton';
import { StatusMessage } from '../components/ui/StatusMessage';
import { useAuth } from '../hooks/useAuth';
import { getApiErrorMessage } from '../utils/apiError';
import { useThemedStyles } from '../hooks/useAppearance';
import type { ThemeColors } from '../features/appearance/theme';
import { Card } from '../components/ui/Card';

export default function SignUp() {
  const { signUp } = useAuth();
  const styles = useThemedStyles(createStyles);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const name = username.trim();
    const address = email.trim();
    if (name.length < 3 || name.length > 30) { setError('Username must have 3–30 characters.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) || address.length > 100) { setError('Enter a valid email.'); return; }
    if (password.length < 8 || password.length > 72 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      setError('Password must have 8–72 characters, uppercase, lowercase and a number.'); return;
    }
    let timeZone = 'UTC';
    try { timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { /* Fallback timezone. */ }
    setBusy(true); setError(null);
    try {
      await signUp({ username: name, email: address, password, timeZone });
      router.replace({ pathname: '/sign-in', params: { registered: '1' } });
    } catch (cause) { setError(getApiErrorMessage(cause, 'Registration failed. Please try again.')); }
    finally { setBusy(false); }
  }

  return (
    <AuthScreen title="Create your account" description="Start tracking your goals with your study partner."
      footer={<Text style={styles.footer}>Already registered? <Link href="/sign-in" style={styles.link}>Sign in</Link></Text>}>
      <Card style={styles.card}>
        <FormField variant="subtle" label="Username" placeholder="Choose a username" value={username}
          onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} autoComplete="username" editable={!busy} />
        <FormField variant="subtle" label="Email" placeholder="you@example.com" value={email} onChangeText={setEmail}
          autoCapitalize="none" keyboardType="email-address" autoComplete="email" editable={!busy} />
        <FormField variant="subtle" label="Password" placeholder="Create a password" value={password} onChangeText={setPassword}
          secureTextEntry autoComplete="new-password" editable={!busy}
          hint="8–72 characters with uppercase, lowercase and a number." />
        {error ? <StatusMessage message={error} error /> : null}
        <ActionButton compact title="Create account" onPress={() => { void submit(); }} busy={busy} />
      </Card>
    </AuthScreen>
  );
}

const createStyles = (palette: ThemeColors) => StyleSheet.create({
  card: { backgroundColor: palette.surface, borderColor: palette.border, borderWidth: 1,
    borderRadius: 10, padding: 16, gap: 16 },
  footer: { textAlign: 'center', color: palette.muted },
  link: { color: palette.primary, fontWeight: '700' },
});
