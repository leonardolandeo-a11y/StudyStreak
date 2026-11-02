import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '../ui/ActionButton';
import { FormField } from '../ui/FormField';
import { StatusMessage } from '../ui/StatusMessage';
import { palette } from '../../constants/palette';
import type { GoalRequest } from '../../types/goal';

type Props = {
  initialValues?: GoalRequest;
  busy: boolean;
  onSubmit: (request: GoalRequest) => Promise<boolean>;
  onCancel: () => void;
};

export function GoalForm({ initialValues, busy, onSubmit, onCancel }: Props) {
  const [topic, setTopic] = useState(initialValues?.topic ?? '');
  const [frequency, setFrequency] = useState(String(initialValues?.frequency ?? 1));
  const [duration, setDuration] = useState(String(initialValues?.duration ?? 30));
  const [completed, setCompleted] = useState(initialValues?.completed ?? false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const name = topic.trim();
    const days = Number(frequency);
    const minutes = Number(duration);
    if (!name) { setError('Topic is required.'); return; }
    if (!Number.isSafeInteger(days) || days <= 0) { setError('Frequency must be a positive integer.'); return; }
    if (!Number.isSafeInteger(minutes) || minutes <= 0) { setError('Duration must be a positive integer.'); return; }
    setError(null);
    await onSubmit({ topic: name, frequency: days, duration: minutes, completed });
  }

  return (
    <View style={styles.form}>
      <Text style={styles.heading}>{initialValues ? 'Edit goal' : 'New study goal'}</Text>
      <FormField label="Topic" placeholder="e.g. Differential equations" value={topic}
        onChangeText={setTopic} maxLength={150} editable={!busy} />
      <FormField label="Frequency" hint="Study sessions per week" value={frequency}
        onChangeText={setFrequency} keyboardType="number-pad" editable={!busy} />
      <FormField label="Duration" hint="Minutes per session" value={duration}
        onChangeText={setDuration} keyboardType="number-pad" editable={!busy} />
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: completed }}
        disabled={busy} onPress={() => setCompleted((value) => !value)} style={styles.checkbox}>
        <Text style={styles.check}>{completed ? '☑' : '☐'}</Text>
        <Text style={styles.checkLabel}>Completed</Text>
      </Pressable>
      {error ? <StatusMessage error message={error} /> : null}
      <ActionButton title={initialValues ? 'Save changes' : 'Create goal'} busy={busy}
        onPress={() => { void submit(); }} />
      <ActionButton title="Cancel" secondary disabled={busy} onPress={onCancel} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 16, padding: 18, gap: 14 },
  heading: { color: palette.text, fontSize: 20, fontWeight: '700' },
  checkbox: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 8 },
  check: { color: palette.primary, fontSize: 24 },
  checkLabel: { color: palette.text, fontSize: 15 },
});
