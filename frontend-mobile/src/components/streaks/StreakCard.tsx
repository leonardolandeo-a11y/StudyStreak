import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { palette } from '../../constants/palette';
import { streakService } from '../../services/streakService';
import { getApiErrorMessage } from '../../utils/apiError';
import type { Streak } from '../../types/streak';

export function StreakCard({ goalId }: { goalId: number }) {
  const [streak, setStreak] = useState<Streak | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const latestRevision = useRef(revision);

  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    latestRevision.current = revision;
    const isCurrent = () => !controller.signal.aborted && latestRevision.current === revision;

    void Promise.resolve().then(async () => {
      if (!isCurrent()) return;
      setLoading(true);
      setError(null);
      try {
        const result = await streakService.get(goalId, controller.signal);
        if (isCurrent()) setStreak(result);
      } catch (cause) {
        if (isCurrent()) setError(getApiErrorMessage(cause, 'Unable to load your streak.'));
      } finally {
        if (isCurrent()) setLoading(false);
      }
    });

    return () => controller.abort();
  }, [goalId, revision]));

  const percentage = streak && streak.bestStreak > 0
    ? Math.min(100, Math.max(0, Math.round((streak.currentStreak / streak.bestStreak) * 100)))
    : 0;

  return (
    <View style={styles.card}>
      <View style={styles.headingRow}>
        <Text style={styles.title}>Study streak</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Refresh study streak"
          onPress={() => setRevision((value) => value + 1)}
          disabled={loading}>
          <Text style={[styles.refresh, loading && styles.disabled]}>Refresh</Text>
        </Pressable>
      </View>
      {loading ? <ActivityIndicator color={palette.primary} /> : null}
      {error ? (
        <View style={styles.messageRow}>
          <Text style={styles.error}>{error}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Retry loading study streak"
            onPress={() => setRevision((value) => value + 1)}>
            <Text style={styles.refresh}>Retry</Text>
          </Pressable>
        </View>
      ) : null}
      {streak ? (
        <>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.label}>Current streak</Text>
              <Text style={styles.value}>{streak.currentStreak} days</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.label}>Best streak</Text>
              <Text style={styles.value}>{streak.bestStreak} days</Text>
            </View>
          </View>
          <View style={styles.progressTrack} accessible
            accessibilityLabel={`Current streak ${streak.currentStreak} days out of best ${streak.bestStreak} days`}>
            <View style={[styles.progressFill, { width: `${percentage}%` as `${number}%` }]} />
          </View>
          <Text style={styles.muted}>Last calculated: {streak.lastUpdateDate}</Text>
          <Text style={styles.muted}>Streaks count consecutive days with approved study records.</Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: palette.border, borderRadius: 16,
    backgroundColor: palette.surface, padding: 17, gap: 13 },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { color: palette.text, fontSize: 20, fontWeight: '700' },
  refresh: { color: palette.primary, fontSize: 14, fontWeight: '700', paddingVertical: 6 },
  disabled: { opacity: 0.5 },
  messageRow: { gap: 8 },
  error: { color: palette.error, fontSize: 14, lineHeight: 20 },
  stats: { flexDirection: 'row', gap: 12 },
  stat: { flex: 1, borderRadius: 12, backgroundColor: palette.surfaceRaised, padding: 14, gap: 7 },
  label: { color: palette.muted, fontSize: 12 },
  value: { color: palette.text, fontWeight: '800', fontSize: 21 },
  progressTrack: { height: 9, borderRadius: 9, backgroundColor: palette.surfaceRaised, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: palette.success, borderRadius: 9 },
  muted: { color: palette.muted, fontSize: 13, lineHeight: 19 },
});
