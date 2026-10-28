import { useCallback, useState } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../components/ui/Screen';
import { ActionButton } from '../../../components/ui/ActionButton';
import { StatusMessage } from '../../../components/ui/StatusMessage';
import { PageControls } from '../../../components/ui/PageControls';
import { GoalForm } from '../../../components/goals/GoalForm';
import { palette } from '../../../constants/palette';
import { useAuth } from '../../../hooks/useAuth';
import { usePagedResource } from '../../../hooks/usePagedResource';
import { goalService } from '../../../services/goalService';
import { getApiErrorMessage } from '../../../utils/apiError';
import type { Goal, GoalRequest } from '../../../types/goal';
import type { PageResponse } from '../../../types/page';

export default function Goals() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;
  const fetchGoals = useCallback((page: number, signal: AbortSignal): Promise<PageResponse<Goal>> => {
    if (userId == null) throw new Error('Not signed in');
    return goalService.list(userId, page, signal);
  }, [userId]);
  const { page, setPage, data, loading, error, reload } = usePagedResource(fetchGoals, userId != null);
  const [showCreate, setShowCreate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function create(request: GoalRequest): Promise<boolean> {
    if (userId == null) return false;
    setBusy(true);
    setFormError(null);
    try {
      await goalService.create(userId, request);
      setShowCreate(false);
      setMessage('Goal created successfully.');
      if (page !== 0) setPage(0);
      else reload();
      return true;
    } catch (cause) {
      setFormError(getApiErrorMessage(cause, 'Unable to create goal.'));
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Pressable accessibilityRole="button" onPress={() => router.back()}>
        <Text style={styles.back}>‹ Home</Text>
      </Pressable>
      <Text style={styles.title}>My Goals</Text>
      <Text style={styles.subtitle}>Create study goals and manage your daily records.</Text>
      <ActionButton title={showCreate ? 'Close form' : 'Create a goal'} secondary={showCreate}
        onPress={() => { setShowCreate((value) => !value); setFormError(null); }} />
      {showCreate ? (
        <GoalForm busy={busy} onSubmit={create} onCancel={() => setShowCreate(false)} />
      ) : null}
      {formError ? <StatusMessage message={formError} error /> : null}
      {message ? <StatusMessage message={message} /> : null}
      <View style={styles.row}>
        <Text style={styles.section}>Your goals</Text>
        <Pressable accessibilityRole="button" onPress={reload}><Text style={styles.link}>Refresh</Text></Pressable>
      </View>
      {loading ? <ActivityIndicator size="large" color={palette.primary} /> : null}
      {error ? <StatusMessage error message={error} /> : null}
      {!loading && data?.empty ? <Text style={styles.empty}>No goals yet. Create your first goal.</Text> : null}
      {!loading && data ? (
        <>
          <Text style={styles.count}>{data.totalElements} goals</Text>
          {data.content.map((goal) => (
            <Pressable key={goal.id} style={styles.card} accessibilityRole="button"
              accessibilityLabel={`Open ${goal.topic}`}
              onPress={() => router.push({ pathname: '/(app)/goals/[goalId]', params: { goalId: String(goal.id) } })}>
              <View style={styles.row}>
                <Text style={styles.topic}>{goal.topic}</Text>
                <Text style={[styles.flag, goal.completed && styles.done]}>{goal.completed ? 'Completed' : 'Active'}</Text>
              </View>
              <Text style={styles.meta}>{goal.frequency} sessions/week · {goal.duration} min/session</Text>
              <Text style={styles.link}>View records ›</Text>
            </Pressable>
          ))}
          <PageControls page={page} totalPages={data.totalPages} onChange={setPage} />
        </>
      ) : null}
      {!loading && error ? <ActionButton secondary title="Retry" onPress={reload} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { color: palette.primary, fontSize: 16, paddingVertical: 4 },
  title: { color: palette.text, fontSize: 30, fontWeight: '800' },
  subtitle: { color: palette.muted, fontSize: 14, lineHeight: 22 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  section: { color: palette.text, fontSize: 20, fontWeight: '700' },
  link: { color: palette.primary, fontWeight: '700', fontSize: 14 },
  count: { color: palette.muted, fontSize: 12 },
  card: { backgroundColor: palette.surface, borderColor: palette.border, borderWidth: 1, borderRadius: 15, padding: 17, gap: 12 },
  topic: { color: palette.text, fontSize: 17, fontWeight: '700', flex: 1 },
  flag: { color: palette.primary, fontSize: 12, fontWeight: '700' },
  done: { color: palette.success },
  meta: { color: palette.muted, fontSize: 13 },
  empty: { color: palette.muted, backgroundColor: palette.surface, padding: 20, borderRadius: 12 },
});
