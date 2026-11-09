import { RecordedSummary } from "../../../components/study/RecordedSummary";
import { useCallback, useRef, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../components/ui/Screen';
import { ActionButton } from '../../../components/ui/ActionButton';
import { StatusMessage } from '../../../components/ui/StatusMessage';
import { PageControls } from '../../../components/ui/PageControls';
import { GoalForm } from '../../../components/goals/GoalForm';
import { DailyRecordForm } from '../../../components/records/DailyRecordForm';
import { DailyRecordCard } from '../../../components/records/DailyRecordCard';
import { CreationModal } from '../../../components/ui/CreationModal';
import { StreakCard } from '../../../components/streaks/StreakCard';
import { useAppearance, useThemedStyles } from '../../../hooks/useAppearance';
import type { ThemeColors } from '../../../features/appearance/theme';
import { useAuth } from '../../../hooks/useAuth';
import { usePagedResource } from '../../../hooks/usePagedResource';
import { goalService } from '../../../services/goalService';
import { getMobileFocusSummary } from '../../../features/focus/focusGoalService';
import type { FocusSummary } from '../../../features/focus/focusGoalService';
import { dailyRecordService } from '../../../services/dailyRecordService';
import { getApiErrorMessage } from '../../../utils/apiError';
import type { Goal, GoalRequest } from '../../../types/goal';
import type { DailyRecord, DailyRecordRequest } from '../../../types/dailyRecord';
import type { PageResponse } from '../../../types/page';

export default function GoalDetails() {
  const styles = useThemedStyles(createStyles);
  const { theme: { colors: palette } } = useAppearance();
  const { goalId: goalParam } = useLocalSearchParams<{ goalId: string }>();
  const { currentUser } = useAuth();
  const userId = currentUser?.id;
  const goalId = Number(goalParam);
  const valid = Number.isSafeInteger(goalId) && goalId > 0 && userId != null;
  const [goal, setGoal] = useState<Goal | null>(null);
  const [goalLoading, setGoalLoading] = useState(true);
  const [goalError, setGoalError] = useState<string | null>(null);
  const [focusSummary, setFocusSummary] = useState<FocusSummary | null>(null);
  const [summaryRevision, setSummaryRevision] = useState(0);
  const latestSummaryRevision = useRef(summaryRevision);
  const [focusSummaryError, setFocusSummaryError] = useState(false);
  const [goalRevision, setGoalRevision] = useState(0);
  const latestGoalRevision = useRef(goalRevision);
  const [editingGoal, setEditingGoal] = useState(false);
  const [showCreateRecord, setShowCreateRecord] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DailyRecord | null>(null);
  const [confirmDeleteGoal, setConfirmDeleteGoal] = useState(false);
  const [confirmDeleteRecord, setConfirmDeleteRecord] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    latestGoalRevision.current = goalRevision;
    const isCurrent = () => !controller.signal.aborted && latestGoalRevision.current === goalRevision;
    void Promise.resolve().then(async () => {
      if (!isCurrent()) return;
      if (!valid || userId == null) {
        setGoalLoading(false);
        return;
      }
      setGoalLoading(true);
      setGoalError(null);
      try {
        const result = await goalService.get(userId, goalId, controller.signal);
        if (isCurrent()) setGoal(result);
      } catch (cause) {
        if (isCurrent()) setGoalError(getApiErrorMessage(cause, 'Unable to load goal.'));
      } finally {
        if (isCurrent()) setGoalLoading(false);
      }
    });
    return () => controller.abort();
  }, [valid, userId, goalId, goalRevision]));

  useFocusEffect(useCallback(() => {
    if (!valid) return;
    const controller = new AbortController();
    latestSummaryRevision.current = summaryRevision;
    let sending = false;
    const refresh = async () => {
      if (sending || controller.signal.aborted || latestSummaryRevision.current !== summaryRevision || AppState.currentState !== 'active') return;
      sending = true;
      try {
        const data = await getMobileFocusSummary(goalId, controller.signal);
        if (!controller.signal.aborted) { setFocusSummary(data); setFocusSummaryError(false); }
      } catch { if (!controller.signal.aborted) setFocusSummaryError(true); }
      finally { sending = false; }
    };
    void refresh();
    const interval = setInterval(() => { void refresh(); }, 30000);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    return () => { controller.abort(); clearInterval(interval); subscription.remove(); };
  }, [valid, goalId, summaryRevision]));

  const loadRecords = useCallback((page: number, signal: AbortSignal): Promise<PageResponse<DailyRecord>> => {
    if (!valid) throw new Error('Invalid goal');
    return dailyRecordService.list(goalId, page, signal);
  }, [valid, goalId]);
  const records = usePagedResource(loadRecords, valid);

  async function saveGoal(request: GoalRequest): Promise<boolean> {
    if (userId == null) return false;
    setBusy(true);
    setMutationError(null);
    try {
      const updated = await goalService.update(userId, goalId, request);
      setGoal(updated);
      setEditingGoal(false);
      setMessage('Goal updated successfully.');
      return true;
    } catch (cause) {
      setMutationError(getApiErrorMessage(cause, 'Unable to update goal.'));
      return false;
    } finally { setBusy(false); }
  }

  function requestDeleteGoal() {
    if (busy || !goal) return;

    setConfirmDeleteGoal(true);
  }

  async function deleteGoal() {
    if (userId == null) return;
    setBusy(true);
    setMutationError(null);
    try {
      await goalService.remove(userId, goalId);
      router.replace('/goals');
    } catch (cause) {
      setMutationError(getApiErrorMessage(cause, 'Unable to delete goal.'));
    } finally { setBusy(false); }
  }

  async function createRecord(request: DailyRecordRequest): Promise<boolean> {
    setBusy(true);
    setMutationError(null);
    try {
      await dailyRecordService.create(goalId, request);
      setShowCreateRecord(false);
      setMessage('Daily record created successfully.');
      if (records.page !== 0) records.setPage(0);
      else records.reload();
      return true;
    } catch (cause) {
      setMutationError(getApiErrorMessage(cause, 'Unable to create daily record.'));
      return false;
    } finally { setBusy(false); }
  }

  async function updateRecord(request: DailyRecordRequest): Promise<boolean> {
    if (!editingRecord) return false;
    setBusy(true);
    setMutationError(null);
    try {
      await dailyRecordService.update(goalId, editingRecord.id, request);
      setEditingRecord(null);
      setMessage('Daily record updated successfully.');
      records.reload();
      return true;
    } catch (cause) {
      setMutationError(getApiErrorMessage(cause, 'Unable to update daily record.'));
      return false;
    } finally { setBusy(false); }
  }

  async function deleteRecord(recordId: number) {
    setBusy(true);
    setMutationError(null);
    try {
      await dailyRecordService.remove(goalId, recordId);
      setConfirmDeleteRecord(null);
      setEditingRecord(null);
      setMessage('Daily record deleted.');
      if (records.page > 0 && records.data?.content.length === 1) records.setPage(records.page - 1);
      else records.reload();
    } catch (cause) {
      setMutationError(getApiErrorMessage(cause, 'Unable to delete daily record.'));
    } finally { setBusy(false); }
  }

  if (!valid) return <Screen themed compact><StatusMessage error message="Invalid goal or session." /></Screen>;

  return (
    <>
    <CreationModal visible={editingGoal} title="Edit goal" busy={busy} onClose={() => setEditingGoal(false)}>
      {goal ? <GoalForm key={`goal-form-${goal.id}`} initialValues={goal} busy={busy} onSubmit={saveGoal} onCancel={() => setEditingGoal(false)} /> : null}
      {mutationError ? <StatusMessage error message={mutationError} /> : null}
    </CreationModal>
    <CreationModal visible={showCreateRecord || editingRecord !== null} title={editingRecord ? 'Edit daily record' : 'Add daily record'} busy={busy}
      onClose={() => { setShowCreateRecord(false); setEditingRecord(null); }}>
      <DailyRecordForm key={editingRecord?.id ?? 'new'} busy={busy}
        initialValues={editingRecord ? { date: editingRecord.date, note: editingRecord.note ?? '', evidence: editingRecord.evidence ?? '' } : undefined}
        onSubmit={editingRecord ? updateRecord : createRecord} onCancel={() => { setShowCreateRecord(false); setEditingRecord(null); }} />
      {mutationError ? <StatusMessage error message={mutationError} /> : null}
    </CreationModal>
    <CreationModal visible={confirmDeleteGoal || confirmDeleteRecord !== null} title={confirmDeleteGoal ? 'Delete goal?' : 'Delete record?'} busy={busy}
      onClose={() => { setConfirmDeleteGoal(false); setConfirmDeleteRecord(null); }}>
      <Text style={styles.warning}>{confirmDeleteGoal ? `Delete ${goal?.topic}? Related records and evidence may be permanently removed. This cannot be undone.` : 'Delete this daily record and its evidence? This cannot be undone.'}</Text>
      {mutationError ? <StatusMessage error message={mutationError} /> : null}
      <ActionButton compact title={confirmDeleteGoal ? 'Delete permanently' : 'Confirm delete record'} busy={busy}
        onPress={() => { if (confirmDeleteGoal) void deleteGoal(); else if (confirmDeleteRecord !== null) void deleteRecord(confirmDeleteRecord); }} />
      <ActionButton compact secondary title="Keep" disabled={busy} onPress={() => { setConfirmDeleteGoal(false); setConfirmDeleteRecord(null); }} />
    </CreationModal>
    <Screen themed compact>
      {goalLoading ? <ActivityIndicator size="large" color={palette.primary} /> : null}
      {goalError ? <StatusMessage error message={goalError} /> : null}
      {goalError ? <ActionButton compact secondary title="Retry goal" onPress={() => setGoalRevision((value) => value + 1)} /> : null}
      {goal && !goalLoading ? (
        <>
          <View style={styles.card}>
            <Text style={styles.title}>{goal.topic}</Text>
            <Text style={styles.muted}>{goal.frequency} sessions/week · {goal.duration} min/session</Text>
            <Text style={goal.completed ? styles.completed : styles.active}>
              {goal.completed ? 'Completed' : 'Active'}
            </Text>
            <ActionButton compact secondary title={editingGoal ? 'Close goal editor' : 'Edit goal'}
              disabled={busy} onPress={() => { setEditingGoal((value) => !value); setMutationError(null); }} />
            {!editingGoal ? (
              <ActionButton compact title="Delete goal" secondary disabled={busy} onPress={requestDeleteGoal} />
            ) : null}
          </View>
          <View style={styles.focusCard}>
            <RecordedSummary minutes={focusSummary?.goalId === goal.id ? focusSummary.totalMinutes : undefined}
              sessions={focusSummary?.goalId === goal.id ? focusSummary.completedSessions : undefined}
              error={focusSummaryError} onRefresh={() => setSummaryRevision(value => value + 1)} />
            <Text style={styles.focusNote}>Saved individual and group sessions. Daily Records and their streaks are tracked separately.</Text>
            <ActionButton compact secondary title="Study Rooms" onPress={() => router.push('/study-rooms')} />
            {!goal.completed && (
              <ActionButton compact title="Study this Goal" onPress={() => router.push({
                pathname: '/focus-studio', params: { goalId: String(goal.id) },
              })} />
            )}
          </View>
          <ActionButton compact secondary title="Manage tags" onPress={() => router.push({ pathname: '/(app)/goals/[goalId]/tags', params: { goalId: String(goalId) } })} />
          <StreakCard key={`streak-${goal.id}`} goalId={goal.id} />
          <ActionButton compact secondary title="Find books for this goal"
            onPress={() => router.push({ pathname: '/resources', params: { topic: goal.topic } })} />
          {mutationError ? <StatusMessage error message={mutationError} /> : null}
          {message ? <StatusMessage message={message} /> : null}
          <View style={styles.row}>
            <Text style={styles.section}>Daily records</Text>
            <Pressable accessibilityRole="button" onPress={records.reload}><Text style={styles.back}>Refresh</Text></Pressable>
          </View>
          {!editingRecord ? (
            <ActionButton compact title={showCreateRecord ? 'Close record form' : 'Add a daily record'}
              secondary={showCreateRecord} disabled={busy}
              onPress={() => { setShowCreateRecord((value) => !value); setMutationError(null); }} />
          ) : null}
          {records.loading ? <ActivityIndicator size="large" color={palette.primary} /> : null}
          {records.error ? <StatusMessage error message={records.error} /> : null}
          {records.error ? <ActionButton compact secondary title="Retry records" onPress={records.reload} /> : null}
          {!records.loading && records.data?.empty ? (
            <Text style={styles.muted}>No daily records for this goal yet.</Text>
          ) : null}
          {!records.loading && records.data ? (
            <>
              <Text style={styles.muted}>{records.data.totalElements} records</Text>
              {records.data.content.map(record => <DailyRecordCard key={record.id} goalId={goalId} record={record} busy={busy} onReload={records.reload}
                onEdit={() => { setEditingRecord(record); setShowCreateRecord(false); setConfirmDeleteRecord(null); setMutationError(null); }}
                onRemove={() => { setMutationError(null); setConfirmDeleteRecord(record.id); }} />)}
              <PageControls page={records.page} totalPages={records.data.totalPages} onChange={records.setPage} />
            </>
          ) : null}
        </>
      ) : null}
    </Screen>
    </>
  );
}

const createStyles = (palette: ThemeColors) => StyleSheet.create({
  back: { color: palette.primary, fontSize: 15, fontWeight: '700', paddingVertical: 3 },
  title: { color: palette.text, fontSize: 24, fontWeight: '800' },
  section: { color: palette.text, fontSize: 21, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  card: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 16, padding: 17, gap: 13 },
  muted: { color: palette.muted, fontSize: 14, lineHeight: 21 },
  recordDate: { color: palette.text, fontSize: 17, fontWeight: '700' },
  active: { color: palette.primary, fontWeight: '700' },
  completed: { color: palette.success, fontWeight: '700' },
  confirm: { borderRadius: 12, padding: 13, backgroundColor: palette.surfaceRaised, gap: 10 },
  warning: { color: palette.error, fontSize: 14, lineHeight: 20 },
  focusCard: { gap: 12 },
  focusNote: { color: palette.muted, fontSize: 14, lineHeight: 21 },
});
