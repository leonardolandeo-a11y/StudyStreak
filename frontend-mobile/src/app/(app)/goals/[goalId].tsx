import { useCallback, useRef, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../components/ui/Screen';
import { ActionButton } from '../../../components/ui/ActionButton';
import { StatusMessage } from '../../../components/ui/StatusMessage';
import { PageControls } from '../../../components/ui/PageControls';
import { GoalForm } from '../../../components/goals/GoalForm';
import { DailyRecordForm } from '../../../components/records/DailyRecordForm';
import { StreakCard } from '../../../components/streaks/StreakCard';
import { palette } from '../../../constants/palette';
import { useAuth } from '../../../hooks/useAuth';
import { usePagedResource } from '../../../hooks/usePagedResource';
import { goalService } from '../../../services/goalService';
import { dailyRecordService } from '../../../services/dailyRecordService';
import { getApiErrorMessage } from '../../../utils/apiError';
import type { Goal, GoalRequest } from '../../../types/goal';
import type { DailyRecord, DailyRecordRequest } from '../../../types/dailyRecord';
import type { PageResponse } from '../../../types/page';

export default function GoalDetails() {
  const { goalId: goalParam } = useLocalSearchParams<{ goalId: string }>();
  const { currentUser } = useAuth();
  const userId = currentUser?.id;
  const goalId = Number(goalParam);
  const valid = Number.isSafeInteger(goalId) && goalId > 0 && userId != null;
  const [goal, setGoal] = useState<Goal | null>(null);
  const [goalLoading, setGoalLoading] = useState(true);
  const [goalError, setGoalError] = useState<string | null>(null);
  const [goalRevision, setGoalRevision] = useState(0);
  const latestGoalRevision = useRef(goalRevision);
  const [editingGoal, setEditingGoal] = useState(false);
  const [confirmDeleteGoal, setConfirmDeleteGoal] = useState(false);
  const [showCreateRecord, setShowCreateRecord] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DailyRecord | null>(null);
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

  async function deleteGoal() {
    if (userId == null) return;
    setBusy(true);
    setMutationError(null);
    try {
      await goalService.remove(userId, goalId);
      router.replace('/(app)/goals');
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

  if (!valid) return <Screen><StatusMessage error message="Invalid goal or session." /></Screen>;

  return (
    <Screen>
      <Pressable accessibilityRole="button" onPress={() => router.back()}>
        <Text style={styles.back}>‹ All goals</Text>
      </Pressable>
      {goalLoading ? <ActivityIndicator size="large" color={palette.primary} /> : null}
      {goalError ? <StatusMessage error message={goalError} /> : null}
      {goalError ? <ActionButton secondary title="Retry goal" onPress={() => setGoalRevision((value) => value + 1)} /> : null}
      {goal && !goalLoading ? (
        <>
          <View style={styles.card}>
            <Text style={styles.title}>{goal.topic}</Text>
            <Text style={styles.muted}>{goal.frequency} sessions/week · {goal.duration} min/session</Text>
            <Text style={goal.completed ? styles.completed : styles.active}>
              {goal.completed ? 'Completed' : 'Active'}
            </Text>
            <ActionButton secondary title={editingGoal ? 'Close goal editor' : 'Edit goal'}
              disabled={busy} onPress={() => { setEditingGoal((value) => !value); setConfirmDeleteGoal(false); setMutationError(null); }} />
            {editingGoal ? <GoalForm key={goal.id} initialValues={goal} busy={busy}
              onSubmit={saveGoal} onCancel={() => setEditingGoal(false)} /> : null}
            {!editingGoal ? (
              <>
                <ActionButton title="Delete goal" secondary disabled={busy}
                  onPress={() => setConfirmDeleteGoal(true)} />
                {confirmDeleteGoal ? (
                  <View style={styles.confirm}>
                    <Text style={styles.warning}>Delete this goal and its associated records?</Text>
                    <ActionButton title="Confirm deletion" busy={busy} onPress={() => { void deleteGoal(); }} />
                    <ActionButton secondary title="Cancel" disabled={busy} onPress={() => setConfirmDeleteGoal(false)} />
                  </View>
                ) : null}
              </>
            ) : null}
          </View>
          <StreakCard key={goal.id} goalId={goal.id} />
          {mutationError ? <StatusMessage error message={mutationError} /> : null}
          {message ? <StatusMessage message={message} /> : null}
          <View style={styles.row}>
            <Text style={styles.section}>Daily records</Text>
            <Pressable accessibilityRole="button" onPress={records.reload}><Text style={styles.back}>Refresh</Text></Pressable>
          </View>
          {!editingRecord ? (
            <ActionButton title={showCreateRecord ? 'Close record form' : 'Add a daily record'}
              secondary={showCreateRecord} disabled={busy}
              onPress={() => { setShowCreateRecord((value) => !value); setMutationError(null); }} />
          ) : null}
          {showCreateRecord ? (
            <DailyRecordForm busy={busy} onSubmit={createRecord}
              onCancel={() => setShowCreateRecord(false)} />
          ) : null}
          {editingRecord ? (
            <DailyRecordForm key={editingRecord.id} busy={busy}
              initialValues={{ date: editingRecord.date, note: editingRecord.note ?? '', evidence: editingRecord.evidence ?? '' }}
              onSubmit={updateRecord} onCancel={() => setEditingRecord(null)} />
          ) : null}
          {records.loading ? <ActivityIndicator size="large" color={palette.primary} /> : null}
          {records.error ? <StatusMessage error message={records.error} /> : null}
          {records.error ? <ActionButton secondary title="Retry records" onPress={records.reload} /> : null}
          {!records.loading && records.data?.empty ? (
            <Text style={styles.muted}>No daily records for this goal yet.</Text>
          ) : null}
          {!records.loading && records.data ? (
            <>
              <Text style={styles.muted}>{records.data.totalElements} records</Text>
              {records.data.content.map((record) => (
                <View key={record.id} style={styles.card}>
                  <Text style={styles.recordDate}>{record.date}</Text>
                  <Text style={styles.muted}>{record.note || 'No notes added.'}</Text>
                  {record.evidence ? <Text style={styles.muted}>Evidence: {record.evidence}</Text> : null}
                  <ActionButton title="Edit record" secondary disabled={busy}
                    onPress={() => { setEditingRecord(record); setShowCreateRecord(false); setConfirmDeleteRecord(null); setMutationError(null); }} />
                  <ActionButton title="Delete record" secondary disabled={busy}
                    onPress={() => setConfirmDeleteRecord(record.id)} />
                  {confirmDeleteRecord === record.id ? (
                    <View style={styles.confirm}>
                      <Text style={styles.warning}>Delete this daily record?</Text>
                      <ActionButton title="Confirm deletion" busy={busy} onPress={() => { void deleteRecord(record.id); }} />
                      <ActionButton title="Cancel" secondary disabled={busy} onPress={() => setConfirmDeleteRecord(null)} />
                    </View>
                  ) : null}
                </View>
              ))}
              <PageControls page={records.page} totalPages={records.data.totalPages} onChange={records.setPage} />
            </>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { color: palette.primary, fontSize: 15, fontWeight: '700', paddingVertical: 3 },
  title: { color: palette.text, fontSize: 27, fontWeight: '800' },
  section: { color: palette.text, fontSize: 21, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  card: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 16, padding: 17, gap: 13 },
  muted: { color: palette.muted, fontSize: 14, lineHeight: 21 },
  recordDate: { color: palette.text, fontSize: 17, fontWeight: '700' },
  active: { color: palette.primary, fontWeight: '700' },
  completed: { color: palette.success, fontWeight: '700' },
  confirm: { borderRadius: 12, padding: 13, backgroundColor: palette.surfaceRaised, gap: 10 },
  warning: { color: palette.error, fontSize: 14, lineHeight: 20 },
});
