import { useCallback, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { isAxiosError } from 'axios';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../components/ui/Screen';
import { ActionButton } from '../../../components/ui/ActionButton';
import { PageControls } from '../../../components/ui/PageControls';
import { StatusMessage } from '../../../components/ui/StatusMessage';
import { ValidationEditor } from '../../../components/validations/ValidationEditor';
import { RecordPhoto } from '../../../components/records/RecordPhoto';
import { RecordVoice } from '../../../components/records/RecordVoice';
import { palette } from '../../../constants/palette';
import { useAuth } from '../../../hooks/useAuth';
import { usePagedResource } from '../../../hooks/usePagedResource';
import { trackingLinkService } from '../../../services/trackingLinkService';
import { goalService } from '../../../services/goalService';
import { dailyRecordService } from '../../../services/dailyRecordService';
import { validationService } from '../../../services/validationService';
import { getApiErrorMessage } from '../../../utils/apiError';
import type { TrackingLink } from '../../../types/trackingLink';
import type { Goal } from '../../../types/goal';
import type { DailyRecord } from '../../../types/dailyRecord';
import type { Validation, ValidationRequest } from '../../../types/validation';
import type { PageResponse } from '../../../types/page';

type Partner = { id: number; username: string };

type PageState<T> = {
  page: number;
  setPage: (page: number) => void;
  data: PageResponse<T> | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
};

function partnerFromLink(link: TrackingLink, currentUserId: number): Partner {
  return link.requesterId === currentUserId
    ? { id: link.receiverId, username: link.receiverUsername }
    : { id: link.requesterId, username: link.requesterUsername };
}

function Section({ step, title, children }: { step: number; title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.step}>Step {step} of 4</Text>
      <Text style={styles.heading}>{title}</Text>
      {children}
    </View>
  );
}

function ListStatus<T>({ state, empty }: { state: PageState<T>; empty: string }) {
  return (
    <>
      {state.loading ? <ActivityIndicator color={palette.primary} /> : null}
      {state.error ? (
        <>
          <StatusMessage message={state.error} error />
          <ActionButton title="Retry" secondary onPress={state.reload} />
        </>
      ) : null}
      {!state.loading && !state.error && state.data?.empty ? <Text style={styles.empty}>{empty}</Text> : null}
    </>
  );
}

function RecordReview({ goalId, record, partnerName }: { goalId: number; record: DailyRecord; partnerName: string }) {
  const [validation, setValidation] = useState<Validation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const currentRevision = useRef(revision);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    currentRevision.current = revision;
    const isCurrent = () => !controller.signal.aborted && currentRevision.current === revision;
    void Promise.resolve().then(async () => {
      if (!isCurrent()) return;
      setLoading(true);
      setError(null);
      setMessage(null);
      try {
        const result = await validationService.get(goalId, record.id, controller.signal);
        if (isCurrent()) setValidation(result);
      } catch (cause) {
        if (!isCurrent()) return;
        if (isAxiosError(cause) && cause.response?.status === 404) {
          setValidation(null);
        } else {
          setError(getApiErrorMessage(cause, 'Could not load the validation.'));
        }
      } finally {
        if (isCurrent()) setLoading(false);
      }
    });
    return () => controller.abort();
  }, [goalId, record.id, revision]));

  async function save(request: ValidationRequest): Promise<boolean> {
    if (saving) return false;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const result = validation
        ? await validationService.update(goalId, record.id, request)
        : await validationService.create(goalId, record.id, request);
      setValidation(result);
      setMessage(validation ? 'Validation updated.' : 'Validation created.');
      return true;
    } catch (cause) {
      if (isAxiosError(cause) && cause.response?.status === 409) {
        setError('This record may already have a validation. Refresh before trying again.');
      } else {
        setError(getApiErrorMessage(cause, 'Could not save the validation.'));
      }
      return false;
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section step={4} title="Review and validate">
      <Text style={styles.meta}>{partnerName} · {record.date}</Text>
      <Text style={styles.label}>Study note</Text>
      <Text style={styles.detail}>{record.note || 'No note provided.'}</Text>
      <Text style={styles.label}>Evidence</Text>
      <Text style={styles.detail}>{record.evidence || 'No evidence provided.'}</Text>
      <RecordPhoto goalId={goalId} recordId={record.id} available={record.photoAvailable} readOnly />
      <RecordVoice goalId={goalId} recordId={record.id} available={record.voiceAvailable} readOnly />
      {loading ? <ActivityIndicator color={palette.primary} /> : null}
      {error ? (
        <>
          <StatusMessage error message={error} />
          <ActionButton title="Reload validation" secondary onPress={() => setRevision((v) => v + 1)} />
        </>
      ) : null}
      {message ? <StatusMessage message={message} /> : null}
      {!loading && !error ? (
        <>
          {validation ? (
            <View style={styles.current}>
              <Text style={styles.detail}>Current decision: {validation.approved ? 'Approved' : 'Rejected'}</Text>
              {validation.comment ? <Text style={styles.meta}>{validation.comment}</Text> : null}
            </View>
          ) : null}
          <ValidationEditor key={`${validation?.id ?? 'new'}-${validation?.approved ?? 'none'}-${validation?.comment ?? ''}`}
            initial={validation} busy={saving} onSubmit={save} />
        </>
      ) : null}
    </Section>
  );
}

function GoalRecords({ goal, partnerName }: { goal: Goal; partnerName: string }) {
  const [selectedRecord, setSelectedRecord] = useState<DailyRecord | null>(null);
  const loadRecords = useCallback((page: number, signal: AbortSignal) =>
    dailyRecordService.list(goal.id, page, signal), [goal.id]);
  const records = usePagedResource(loadRecords);

  return (
    <>
      <Section step={3} title={`Daily records · ${goal.topic}`}>
        <Text style={styles.meta}>Choose a record to review the note and evidence.</Text>
        <ActionButton secondary title="Refresh records" onPress={records.reload} />
        <ListStatus state={records} empty="This goal has no daily records." />
        {!records.loading && !records.error && records.data ? (
          <>
            <Text style={styles.count}>{records.data.totalElements} records</Text>
            {records.data.content.map((record) => (
              <Pressable key={record.id} accessibilityRole="button" accessibilityLabel={`Review record ${record.date}`}
                onPress={() => setSelectedRecord(record)}
                style={[styles.item, selectedRecord?.id === record.id && styles.itemSelected]}>
                <Text style={styles.itemTitle}>{record.date}</Text>
                <Text numberOfLines={2} style={styles.meta}>{record.note || 'No note provided.'}</Text>
                <Text style={styles.link}>{selectedRecord?.id === record.id ? 'Selected' : 'Review record'}</Text>
              </Pressable>
            ))}
            <PageControls page={records.page} totalPages={records.data.totalPages} onChange={records.setPage} />
          </>
        ) : null}
      </Section>
      {selectedRecord ? <RecordReview key={selectedRecord.id} goalId={goal.id} record={selectedRecord} partnerName={partnerName} /> : null}
    </>
  );
}

function PartnerGoals({ partner }: { partner: Partner }) {
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const loadGoals = useCallback((page: number, signal: AbortSignal) =>
    goalService.list(partner.id, page, signal), [partner.id]);
  const goals = usePagedResource(loadGoals);

  return (
    <>
      <Section step={2} title={`Study goals · ${partner.username}`}>
        <Text style={styles.meta}>Select a goal from your tracking partner.</Text>
        <ActionButton secondary title="Refresh goals" onPress={goals.reload} />
        <ListStatus state={goals} empty="This partner has no goals." />
        {!goals.loading && !goals.error && goals.data ? (
          <>
            <Text style={styles.count}>{goals.data.totalElements} goals</Text>
            {goals.data.content.map((goal) => (
              <Pressable key={goal.id} accessibilityRole="button" accessibilityLabel={`View records for ${goal.topic}`}
                onPress={() => setSelectedGoal(goal)}
                style={[styles.item, selectedGoal?.id === goal.id && styles.itemSelected]}>
                <Text style={styles.itemTitle}>{goal.topic}</Text>
                <Text style={styles.meta}>{goal.completed ? 'Completed' : 'Active'} · {goal.frequency} sessions/week</Text>
                <Text style={styles.link}>{selectedGoal?.id === goal.id ? 'Selected' : 'View daily records'}</Text>
              </Pressable>
            ))}
            <PageControls page={goals.page} totalPages={goals.data.totalPages} onChange={goals.setPage} />
          </>
        ) : null}
      </Section>
      {selectedGoal ? <GoalRecords key={selectedGoal.id} goal={selectedGoal} partnerName={partner.username} /> : null}
    </>
  );
}

export default function Validations() {
  const { currentUser } = useAuth();
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const loadPartners = useCallback((page: number, signal: AbortSignal) =>
    trackingLinkService.active(page, signal), []);
  const partners = usePagedResource(loadPartners, currentUser !== null);

  if (!currentUser) return null;

  return (
    <Screen>
      <Pressable accessibilityRole="button" onPress={() => router.back()}>
        <Text style={styles.back}>‹ Home</Text>
      </Pressable>
      <Text style={styles.title}>Validations</Text>
      <Text style={styles.subtitle}>Review study records from your connected partners.</Text>
      <Section step={1} title="Tracking partners">
        <ActionButton secondary title="Refresh partners" onPress={partners.reload} />
        <ListStatus state={partners} empty="No active tracking partners yet." />
        {!partners.loading && !partners.error && partners.data ? (
          <>
            <Text style={styles.count}>{partners.data.totalElements} partners</Text>
            {partners.data.content.map((link) => {
              const partner = partnerFromLink(link, currentUser.id);
              return (
                <Pressable key={link.id} accessibilityRole="button" accessibilityLabel={`Review goals from ${partner.username}`}
                  onPress={() => setSelectedPartner(partner)}
                  style={[styles.item, selectedPartner?.id === partner.id && styles.itemSelected]}>
                  <Text style={styles.itemTitle}>{partner.username}</Text>
                  <Text style={styles.link}>{selectedPartner?.id === partner.id ? 'Selected' : 'View goals'}</Text>
                </Pressable>
              );
            })}
            <PageControls page={partners.page} totalPages={partners.data.totalPages} onChange={partners.setPage} />
          </>
        ) : null}
      </Section>
      {selectedPartner ? <PartnerGoals key={selectedPartner.id} partner={selectedPartner} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { color: palette.primary, fontSize: 16, paddingVertical: 4 },
  title: { color: palette.text, fontSize: 30, fontWeight: '800' },
  subtitle: { color: palette.muted, fontSize: 14, lineHeight: 22 },
  section: { gap: 12, padding: 18, borderWidth: 1, borderColor: palette.border,
    backgroundColor: palette.surface, borderRadius: 16 },
  step: { color: palette.primary, fontSize: 12, fontWeight: '700' },
  heading: { color: palette.text, fontSize: 20, fontWeight: '700' },
  meta: { color: palette.muted, fontSize: 13, lineHeight: 20 },
  detail: { color: palette.text, fontSize: 14, lineHeight: 22 },
  label: { color: palette.muted, fontSize: 12, fontWeight: '700' },
  count: { color: palette.muted, fontSize: 12 },
  empty: { color: palette.muted, fontSize: 14, paddingVertical: 10 },
  item: { borderWidth: 1, borderColor: palette.border, backgroundColor: palette.background,
    borderRadius: 12, padding: 14, gap: 8 },
  itemSelected: { borderColor: palette.primary },
  itemTitle: { color: palette.text, fontSize: 16, fontWeight: '700' },
  link: { color: palette.primary, fontSize: 13, fontWeight: '700' },
  current: { backgroundColor: palette.surfaceRaised, borderRadius: 12, padding: 13, gap: 6 },
});
