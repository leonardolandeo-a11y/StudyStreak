import { AcademicSprite } from '../../../../../components/academic/AcademicSprite';
import { workspacePalette } from '../../../../../components/academic/workspacePalette';
import { NavigationPressable } from '../../../../../components/navigation/NavigationPressable';
import { AcademicHeading, AcademicEmpty } from '../../../../../components/academic/Academic';
import { useCallback, useState } from 'react';
import { router } from 'expo-router';
import { useMenuAction } from '../../../../../contexts/MenuActionContext';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../../../components/ui/Screen';
import { ActionButton } from '../../../../../components/ui/ActionButton';
import { StatusMessage } from '../../../../../components/ui/StatusMessage';
import { PageControls } from '../../../../../components/ui/PageControls';
import { CreationModal } from '../../../../../components/ui/CreationModal';
import { GoalForm } from '../../../../../components/goals/GoalForm';
import { useAppearance } from '../../../../../hooks/useAppearance';
import type { ThemeColors } from '../../../../../features/appearance/theme';
import { useAuth } from '../../../../../hooks/useAuth';
import { usePagedResource } from '../../../../../hooks/usePagedResource';
import { goalService } from '../../../../../services/goalService';
import { getApiErrorMessage } from '../../../../../utils/apiError';
import type { Goal, GoalRequest } from '../../../../../types/goal';
import type { PageResponse } from '../../../../../types/page';

export default function Goals() {
  const { theme, reduceMotion } = useAppearance();
  const palette = workspacePalette(theme);
  const styles = createStyles(palette);
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

  const menuScroll = useMenuAction('Create a goal', () => { setShowCreate(true); setFormError(null); }, showCreate, () => { if (!busy) setShowCreate(false); });

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

  return <>
    <CreationModal visible={showCreate} title="New Goal" busy={busy} onClose={() => setShowCreate(false)}>
      <GoalForm busy={busy} onSubmit={create} onCancel={() => setShowCreate(false)} />
      {formError ? <StatusMessage message={formError} error /> : null}
    </CreationModal>
    <Screen themed compact scrollRef={menuScroll} backgroundColor={palette.background}>
      <AcademicHeading title="My Goals" eyebrow="YOUR STUDY GOALS" glyph="book" description="Create study goals and manage their daily records." art={<AcademicSprite name="books" width={60}/>} />
      <ActionButton compact title="Create Goal" onPress={() => { setShowCreate(true); setFormError(null); }}/>
      {message ? <StatusMessage message={message} /> : null}
      <View style={styles.row}>
        <Text style={styles.section}>Your goals</Text>
        <Pressable accessibilityRole="button" onPress={reload}><Text style={styles.link}>Refresh</Text></Pressable>
      </View>
      {loading ? <ActivityIndicator size="large" color={palette.primary} /> : null}
      {error ? <StatusMessage error message={error} /> : null}
      {!loading && data?.empty ? <AcademicEmpty><Text style={styles.empty}>No goals yet. Create your first goal.</Text></AcademicEmpty> : null}
      {!loading && data ? (
        <>
          <Text style={styles.count}>{data.totalElements} goals</Text>
          {data.content.map((goal) => (
            <View key={goal.id} style={styles.card}><NavigationPressable accessibilityRole="button"
              accessibilityLabel={`Open ${goal.topic}`}
              onPress={() => router.push({ pathname: '/(app)/goals/[goalId]', params: { goalId: String(goal.id) } })} style={({ pressed }) => ({ padding: 14, gap: 8, borderRadius: 10, opacity: pressed ? .8 : 1, transform: [{ scale: pressed && !reduceMotion ? .98 : 1 }] })}>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}><AcademicSprite name={goal.completed ? 'notebook' : 'books'} width={44}/><View style={{ flex: 1, gap: 8 }}>
              <View style={styles.row}>
                <Text style={styles.topic}>{goal.topic}</Text>
                <Text style={[styles.flag, goal.completed && styles.done]}>{goal.completed ? 'Completed' : 'Active'}</Text>
              </View>
              <Text style={styles.meta}>{goal.frequency} sessions/week · {goal.duration} min/session</Text>
              <Text style={styles.meta}>{goal.completed ? 'Goal completed' : 'Explore progress & daily records →'}</Text>
              </View></View>
            </NavigationPressable>
            {!goal.completed && <ActionButton compact secondary title="Focus on this Goal" onPress={() => router.push({pathname:'/focus-studio',params:{goalId:String(goal.id)}})} />}
            </View>
          ))}
          <PageControls page={page} totalPages={data.totalPages} onChange={setPage} />
        </>
      ) : null}
      {!loading && error ? <ActionButton compact secondary title="Retry" onPress={reload} /> : null}
    </Screen>
  </>;
}

const createStyles = (palette: ThemeColors) => StyleSheet.create({
  back: { color: palette.primary, fontSize: 16, paddingVertical: 4 },
  title: { color: palette.text, fontSize: 24, fontWeight: '800' },
  subtitle: { color: palette.muted, fontSize: 14, lineHeight: 22 },
  row: { flexDirection: 'row', flexWrap:'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  section: { color: palette.text, fontSize: 20, fontWeight: '700' },
  link: { color: palette.primary, fontWeight: '700', fontSize: 14 },
  count: { color: palette.muted, fontSize: 12 },
  card: { backgroundColor: palette.surface, borderColor: palette.border, borderWidth: 1, borderRadius: 12, padding: 0, gap: 0 },
  topic: { color: palette.text, fontSize: 17, fontWeight: '700', flex: 1 },
  flag: { color: palette.primary, fontSize: 12, fontWeight: '700' },
  done: { color: palette.success },
  meta: { color: palette.muted, fontSize: 13 },
  empty: { color: palette.muted, backgroundColor: palette.surface, padding: 20, borderRadius: 12 },
});
