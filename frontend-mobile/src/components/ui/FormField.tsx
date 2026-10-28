import type { ComponentProps } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { palette } from '../../constants/palette';

type FieldProps = ComponentProps<typeof TextInput> & { label: string; hint?: string };

export function FormField({ label, hint, ...props }: FieldProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput {...props} accessibilityLabel={label} placeholderTextColor={palette.muted}
        style={[styles.input, props.style]} />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 7 },
  label: { color: palette.text, fontWeight: '600', fontSize: 14 },
  input: { backgroundColor: palette.background, borderWidth: 1, borderColor: palette.border, borderRadius: 10,
    color: palette.text, minHeight: 48, paddingHorizontal: 14, fontSize: 16 },
  hint: { color: palette.muted, fontSize: 12 },
});
