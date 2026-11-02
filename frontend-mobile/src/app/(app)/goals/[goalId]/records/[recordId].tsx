import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../../../components/ui/Screen';
import { ActionButton } from '../../../../../components/ui/ActionButton';
import { StatusMessage } from '../../../../../components/ui/StatusMessage';
import { ValidationEditor } from '../../../../../components/validations/ValidationEditor';
import { RecordPhoto } from '../../../../../components/records/RecordPhoto';
import { RecordVoice } from '../../../../../components/records/RecordVoice';
import { palette } from '../../../../../constants/palette';
import { dailyRecordService } from '../../../../../services/dailyRecordService';
import { validationService } from '../../../../../services/validationService';
import { getApiErrorMessage } from '../../../../../utils/apiError';
import { reviewedRecordExit, validationLookupState } from '../../../../../utils/reviewNavigation';
import type { DailyRecord } from '../../../../../types/dailyRecord';
import type { Validation, ValidationRequest } from '../../../../../types/validation';

export default function ReviewedRecordDetails() {
  const { goalId: goalParam, recordId: recordParam, review } = useLocalSearchParams<{
    goalId: string;
    recordId: string;
    review?: string;
  }>();
  const reviewRequested = review === '1';
  const goalId = Number(goalParam);
  const recordId = Number(recordParam);
  const valid = Number.isSafeInteger(goalId) && goalId > 0 &&
    Number.isSafeInteger(recordId) && recordId > 0;
  const [record, setRecord] = useState<DailyRecord | null>(null);
  const [validation, setValidation] = useState<Validation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationAccess, setValidationAccess] = useState<'forbidden' | 'unavailable' | null>(null);
  const [revision, setRevision] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!valid) return;
    const controller = new AbortController();
    void Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      setLoading(true);
      setError(null);
      setRecord(null);
      setValidation(null);
      setValidationError(null);
      setValidationAccess(null);
      setSaveMessage(null);
      try {
        const current = await dailyRecordService.get(goalId, recordId, controller.signal);
        if (controller.signal.aborted) return;
        setRecord(current);
        try {
          const review = await validationService.get(goalId, recordId, controller.signal);
          if (!controller.signal.aborted) setValidation(review);
        } catch (cause) {
          if (!controller.signal.aborted) {
            const result = validationLookupState(isAxiosError(cause) ? cause.response?.status : undefined);
            if (result !== 'missing') {
              setValidationAccess(result);
              setValidationError(result === 'forbidden'
                ? 'This record was already validated by another user.'
                : getApiErrorMessage(cause, 'Unable to load peer validation.'));
            }
          }
        }
      } catch (cause) {
        if (!controller.signal.aborted) setError(getApiErrorMessage(cause, 'Unable to load the record.'));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    });
    return () => controller.abort();
  }, [goalId, recordId, valid, revision]);

  async function saveValidation(request: ValidationRequest): Promise<boolean> {
    if (saving || !valid) return false;
    setSaving(true);
    setValidationError(null);
    setSaveMessage(null);
    try {
      const result = validation
        ? await validationService.update(goalId, recordId, request)
        : await validationService.create(goalId, recordId, request);
      setValidation(result);
      setSaveMessage(validation ? 'Validation updated.' : 'Validation created.');
      return true;
    } catch (cause) {
      setValidationError(getApiErrorMessage(cause, 'Could not save the validation.'));
      return false;
    } finally {
      setSaving(false);
    }
  }

  if (!valid) return <Screen><StatusMessage error message="Invalid record link." /></Screen>;

  return (
    <Screen>
      <Pressable accessibilityRole="button" onPress={() => router.back()}>
        <Text style={styles.back}>‹ Back</Text>
      </Pressable>
      <Text style={styles.title}>Daily record</Text>
      {loading ? <ActivityIndicator size="large" color={palette.primary} /> : null}
      {error ? (
        <>
          <StatusMessage error message={error} />
          <ActionButton secondary title="Try again" onPress={() => setRevision((n) => n + 1)} />
        </>
      ) : null}
      {record ? (
        <>
          <View style={styles.card}>
            <Text style={styles.heading}>{record.date}</Text>
            <Text style={styles.body}>{record.note || 'No notes added.'}</Text>
            {record.evidence ? <Text style={styles.body}>Evidence: {record.evidence}</Text> : null}
            <Text style={styles.muted}>Record #{record.id}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.heading}>Peer validation</Text>
            {validation ? (
              <>
                <Text style={validation.approved ? styles.approved : styles.rejected}>
                  {validation.approved ? 'Approved' : 'Rejected'}
                </Text>
                <Text style={styles.body}>{validation.comment || 'No comment provided.'}</Text>
              </>
            ) : (
              <Text style={styles.muted}>{validationError || 'Awaiting peer review.'}</Text>
            )}
          </View>
          {reviewRequested ? (
            <View style={styles.card}>
              <Text style={styles.heading}>Review this record</Text>
              <RecordPhoto goalId={goalId} recordId={recordId} available={record.photoAvailable} readOnly />
              <RecordVoice goalId={goalId} recordId={recordId} available={record.voiceAvailable} readOnly />
              {saveMessage ? <StatusMessage message={saveMessage} /> : null}
              {validationError ? <StatusMessage error message={validationError} /> : null}
              {validationAccess === 'unavailable' ? (
                <ActionButton secondary title="Retry validation" onPress={() => setRevision((n) => n + 1)} />
              ) : null}
              {validationAccess === null ? (
                <ValidationEditor key={validation?.id ?? 'new'} initial={validation}
                  busy={saving} onSubmit={saveValidation} />
              ) : null}
            </View>
          ) : null}
          {reviewedRecordExit(reviewRequested) === 'validations' ? (
            <ActionButton secondary title="Browse partner goals" onPress={() => router.push('/(app)/validations')} />
          ) : (
            <ActionButton secondary title="View full goal" onPress={() => router.push({
              pathname: '/(app)/goals/[goalId]', params: { goalId: String(goalId) },
            })} />
          )}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { color: palette.primary, fontSize: 16, fontWeight: '700' },
  title: { color: palette.text, fontSize: 27, fontWeight: '800' },
  card: { padding: 18, gap: 12, borderWidth: 1, borderColor: palette.border,
    borderRadius: 16, backgroundColor: palette.surface },
  heading: { color: palette.text, fontSize: 21, fontWeight: '700' },
  body: { color: palette.text, fontSize: 15, lineHeight: 24 },
  muted: { color: palette.muted, fontSize: 14, lineHeight: 22 },
  approved: { color: palette.success, fontSize: 17, fontWeight: '700' },
  rejected: { color: palette.error, fontSize: 17, fontWeight: '700' },
});
