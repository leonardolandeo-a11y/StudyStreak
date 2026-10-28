import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '../ui/ActionButton';
import { FormField } from '../ui/FormField';
import { StatusMessage } from '../ui/StatusMessage';
import { palette } from '../../constants/palette';
import type { DailyRecordRequest } from '../../types/dailyRecord';

type Props = {
  initialValues?: DailyRecordRequest;
  busy: boolean;
  onSubmit: (request: DailyRecordRequest) => Promise<boolean>;
  onCancel: () => void;
};

function todayLocal(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function DailyRecordForm({ initialValues, busy, onSubmit, onCancel }: Props) {
  const [date, setDate] = useState(initialValues?.date ?? todayLocal());
  const [note, setNote] = useState(initialValues?.note ?? '');
  const [evidence, setEvidence] = useState(initialValues?.evidence ?? '');
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const parsed = new Date(`${date}T12:00:00`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsed.getTime()) ||
        `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}` !== date ||
        date > todayLocal()) {
      setError('Enter a valid date in YYYY-MM-DD format, no later than today.');
      return;
    }
    if (note.length > 1000) { setError('Notes cannot exceed 1000 characters.'); return; }
    setError(null);
    await onSubmit({ date, note: note.trim(), evidence: evidence.trim() });
  }

  return (
    <View style={styles.form}>
      <Text style={styles.heading}>{initialValues ? 'Edit daily record' : 'Add daily record'}</Text>
      <FormField label="Date" hint="YYYY-MM-DD" placeholder="YYYY-MM-DD" value={date}
        onChangeText={setDate} autoCapitalize="none" keyboardType="numbers-and-punctuation" editable={!busy} />
      <FormField label="Notes" hint={`${note.length}/1000 characters`} value={note}
        onChangeText={setNote} multiline numberOfLines={4} maxLength={1000}
        placeholder="What did you study?" style={styles.note} editable={!busy} />
      <FormField label="Evidence" hint="Optional link or description" value={evidence}
        onChangeText={setEvidence} placeholder="Study evidence" editable={!busy} />
      {error ? <StatusMessage error message={error} /> : null}
      <ActionButton title={initialValues ? 'Save record' : 'Create record'} busy={busy}
        onPress={() => { void submit(); }} />
      <ActionButton title="Cancel" secondary disabled={busy} onPress={onCancel} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 16, padding: 18, gap: 14 },
  heading: { color: palette.text, fontSize: 20, fontWeight: '700' },
  note: { minHeight: 92, textAlignVertical: 'top', paddingVertical: 12 },
});
