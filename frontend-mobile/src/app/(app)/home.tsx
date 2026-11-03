import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { AppState, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { ActionButton } from '../../components/ui/ActionButton';
import { StatusMessage } from '../../components/ui/StatusMessage';
import { useAuth } from '../../hooks/useAuth';
import { palette } from '../../constants/palette';
import { notificationService } from '../../services/notificationService';

export default function Home() {
  const { currentUser, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<{ userId: number; count: number } | null>(null);
  const userId = currentUser?.id;

  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    let inFlight = false;

    const refresh = () => {
      if (userId == null || inFlight || controller.signal.aborted) return;
      inFlight = true;
      void notificationService.countUnread(userId, controller.signal)
        .then((count) => {
          if (!controller.signal.aborted) setUnreadCount({ userId, count });
        })
        .catch(() => {
          // Preserve the last count during temporary network failures.
        })
        .finally(() => { inFlight = false; });
    };

    refresh();
    const refreshWhenActive = () => {
      if (AppState.currentState === 'active') refresh();
    };
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshWhenActive();
    });
    const intervalId = setInterval(refreshWhenActive, 30000);

    return () => {
      controller.abort();
      subscription.remove();
      clearInterval(intervalId);
    };
  }, [userId]));

  async function handleSignOut() {
    setBusy(true);
    setError(null);
    try {
      await signOut();
    } catch {
      setError('Could not sign out. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (!currentUser) return null;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.brand}>STUDYSTREAK</Text>
        <Text style={styles.title}>Welcome, {currentUser.username}</Text>
        <Text style={styles.subtitle}>{currentUser.email}</Text>
      </View>
      <View style={styles.focusCard}>
        <Text style={styles.focusEyebrow}>♫  YOUR PERSONAL LISTENING ROOM</Text>
        <Text style={styles.focusTitle}>Focus Studio</Text>
        <Text style={styles.focusDescription}>A Pomodoro timer, classical-inspired music, lo-fi, white and brown noise, and more — all offline.</Text>
        <ActionButton title="Open Focus Studio" onPress={() => router.push('/(app)/focus-studio')} />
      </View>
      <View style={styles.roomCard}>
        <Text style={styles.focusEyebrow}>● FRIENDS & FOCUS</Text>
        <Text style={styles.roomTitle}>Study Rooms</Text>
        <Text style={styles.focusDescription}>Create a private room, invite friends and follow one synchronized group Pomodoro.</Text>
        <ActionButton title="Open Study Rooms" onPress={() => router.push('/(app)/study-rooms')} />
      </View>
      <View style={styles.card}>
        <Text style={styles.heading}>Your study goals</Text>
        <Text style={styles.description}>Create goals and record your daily progress.</Text>
        <ActionButton title="Open my goals" onPress={() => router.push('/(app)/goals')} />
        <ActionButton title="Find study books" secondary onPress={() => router.push('/(app)/resources')} />
        <ActionButton title="Tracking and study partners" secondary onPress={() => router.push('/(app)/tracking')} />
        <ActionButton title="Review validations" secondary onPress={() => router.push('/(app)/validations')} />
        <ActionButton title={unreadCount !== null && unreadCount.userId === userId ? `Notifications (${unreadCount.count} unread)` : "Notifications"}
          secondary onPress={() => router.push('/(app)/notifications')} />
      </View>
      {error ? <StatusMessage message={error} error /> : null}
      <ActionButton title="Sign out" secondary busy={busy} onPress={() => { void handleSignOut(); }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 9, paddingTop: 36, paddingBottom: 10 },
  brand: { color: palette.primary, letterSpacing: 2, fontWeight: '800', fontSize: 12 },
  title: { color: palette.text, fontSize: 30, fontWeight: '800' },
  subtitle: { color: palette.muted, fontSize: 14 },
  card: { borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface,
    padding: 22, borderRadius: 18, gap: 14 },
  heading: { color: palette.text, fontWeight: '700', fontSize: 18 },
  roomCard: { backgroundColor: '#122b34', borderColor: '#225d55', borderWidth: 1, borderRadius: 22, padding: 21, gap: 12 },
  roomTitle: { color: '#fff', fontSize: 27, fontWeight: '900' },
  focusCard: { backgroundColor: '#133325', borderColor: '#245b3b', borderWidth: 1, borderRadius: 22, padding: 21, gap: 12 },
  focusEyebrow: { color: '#86efac', fontWeight: '800', letterSpacing: 1.6, fontSize: 10 },
  focusTitle: { color: '#fff', fontWeight: '900', fontSize: 28 },
  focusDescription: { color: '#c1dfd1', lineHeight: 21, fontSize: 13 },
  description: { color: palette.muted, fontSize: 14, lineHeight: 23 },
});
