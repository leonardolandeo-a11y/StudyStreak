import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '../ui/ActionButton';
import { FormField } from '../ui/FormField';
import { palette } from '../../constants/palette';
import type { Validation, ValidationRequest } from '../../types/validation';

type Props = {
  initial: Validation | null;
  busy: boolean;
  onSubmit: (request: ValidationRequest) => Promise<boolean>;
};

export function ValidationEditor({ initial, busy, onSubmit }: Props) {
  const [approved, setApproved] = useState<boolean | null>(initial?.approved ?? null);
  const [comment, setComment] = useState(initial?.comment ?? '');
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (approved === null) {
      setError('Choose Approve or Reject before saving.');
      return;
    }
    setError(null);
    await onSubmit({ approved, comment: comment.trim() });
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Your decision</Text>
      <View style={styles.choices}>
        <Pressable accessibilityRole="radio" accessibilityState={{ checked: approved === true }}
          onPress={() => { setApproved(true); setError(null); }} disabled={busy}
          style={[styles.choice, approved === true && styles.selected]}>
          <Text style={[styles.choiceText, approved === true && styles.selectedText]}>Approve</Text>
        </Pressable>
        <Pressable accessibilityRole="radio" accessibilityState={{ checked: approved === false }}
          onPress={() => { setApproved(false); setError(null); }} disabled={busy}
          style={[styles.choice, approved === false && styles.selected]}>
          <Text style={[styles.choiceText, approved === false && styles.selectedText]}>Reject</Text>
        </Pressable>
      </View>
      <FormField label="Comment (optional)" value={comment} onChangeText={setComment}
        maxLength={500} multiline numberOfLines={3} textAlignVertical="top"
        editable={!busy} style={styles.comment} placeholder="Explain your decision" />
      <Text style={styles.counter}>{comment.length}/500</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <ActionButton title={initial ? 'Update validation' : 'Create validation'} busy={busy}
        onPress={() => { void submit(); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  label: { color: palette.text, fontWeight: '700', fontSize: 15 },
  choices: { flexDirection: 'row', gap: 10 },
  choice: { flex: 1, paddingVertical: 15, backgroundColor: palette.surfaceRaised, borderWidth: 1,
    borderColor: palette.border, borderRadius: 12, alignItems: 'center' },
  selected: { borderColor: palette.primary, backgroundColor: '#082f49' },
  choiceText: { color: palette.muted, fontWeight: '700' },
  selectedText: { color: palette.text },
  comment: { minHeight: 90, paddingTop: 12 },
  counter: { color: palette.muted, textAlign: 'right', fontSize: 12 },
  error: { color: palette.error, fontSize: 13 },
});
