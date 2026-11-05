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

export function DailyRecordForm({ initialValues, busy, onSubmit, onCancel }: Props) {
  const date = initialValues?.date;
  const [note, setNote] = useState(initialValues?.note ?? '');
  const [evidence, setEvidence] = useState(initialValues?.evidence ?? '');
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (note.length > 1000) { setError('Notes cannot exceed 1000 characters.'); return; }
    setError(null);
    await onSubmit({ note: note.trim(), evidence: evidence.trim() });
  }

  return (
    <View style={styles.form}>
      <Text style={styles.heading}>{initialValues ? 'Edit daily record' : 'Add daily record'}</Text>
      <View style={styles.datePanel}>
        <Text style={styles.dateLabel}>
          {date ? `Original date: ${date}` : 'Date: automatically assigned on save'}
        </Text>
        <Text style={styles.dateHint}>
          {date ? 'La fecha original es de solo lectura y no se puede modificar.' : 'La fecha se asignará automáticamente al guardar según la zona horaria de tu cuenta'}
        </Text>
      </View>
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
  dateLabel: { color: palette.text, fontSize: 16, fontWeight: '600' },
  datePanel: {backgroundColor:palette.background,borderLeftWidth:2,borderLeftColor:palette.primary,padding:14,gap:8,borderRadius:10},
  dateHint: { color: palette.muted, fontSize: 14, lineHeight:21 },
  note: { minHeight: 92, textAlignVertical: 'top', paddingVertical: 12 },
});
