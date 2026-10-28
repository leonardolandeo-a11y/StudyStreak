import { useState } from 'react';
import { Link, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/ui/Screen';
import { FormField } from '../components/ui/FormField';
import { ActionButton } from '../components/ui/ActionButton';
import { StatusMessage } from '../components/ui/StatusMessage';
import { useAuth } from '../hooks/useAuth';
import { getApiErrorMessage } from '../utils/apiError';
import { palette } from '../constants/palette';

export default function SignUp() {
  const { signUp } = useAuth();
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
    <Screen>
      <View style={styles.heading}>
        <Text style={styles.brand}>STUDYSTREAK</Text>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.description}>Start tracking your goals with your study partner.</Text>
      </View>
      <View style={styles.card}>
        <FormField label="Username" placeholder="Choose a username" value={username}
          onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} autoComplete="username" editable={!busy} />
        <FormField label="Email" placeholder="you@example.com" value={email} onChangeText={setEmail}
          autoCapitalize="none" keyboardType="email-address" autoComplete="email" editable={!busy} />
        <FormField label="Password" placeholder="Create a password" value={password} onChangeText={setPassword}
          secureTextEntry autoComplete="new-password" editable={!busy}
          hint="8–72 characters with uppercase, lowercase and a number." />
        {error ? <StatusMessage message={error} error /> : null}
        <ActionButton title="Create account" onPress={() => { void submit(); }} busy={busy} />
      </View>
      <Text style={styles.footer}>Already registered? <Link href="/sign-in" style={styles.link}>Sign in</Link></Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { gap: 12, marginTop: 24, marginBottom: 4 },
  brand: { color: palette.primary, fontSize: 13, letterSpacing: 2, fontWeight: '800' },
  title: { color: palette.text, fontSize: 30, fontWeight: '800' },
  description: { color: palette.muted, fontSize: 15, lineHeight: 23 },
  card: { backgroundColor: palette.surface, borderColor: palette.border, borderWidth: 1,
    borderRadius: 18, padding: 20, gap: 16 },
  footer: { textAlign: 'center', color: palette.muted },
  link: { color: palette.primary, fontWeight: '700' },
});
