import { useState, type ComponentProps } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useAppearance, useThemedStyles } from '../../hooks/useAppearance';
import type { ThemeColors } from '../../features/appearance/theme';

type FieldProps = ComponentProps<typeof TextInput> & { label: string; hint?: string };

export function FormField({ label, hint, ...props }: FieldProps) {
  const [focused, setFocused] = useState(false);
  const { theme } = useAppearance();
  const palette = theme.colors;
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput {...props} accessibilityLabel={label} placeholderTextColor={palette.muted}
        selectionColor={palette.primary} keyboardAppearance={theme.mode}
        onFocus={event => { setFocused(true); props.onFocus?.(event); }}
        onBlur={event => { setFocused(false); props.onBlur?.(event); }}
        style={[styles.input, props.style, focused && styles.focused]} />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const createStyles = (palette: ThemeColors) => StyleSheet.create({
  wrap: { gap: 7, backgroundColor: palette.surface, borderRadius: 12 },
  label: { color: palette.text, fontWeight: '600', fontSize: 14 },
  input: { backgroundColor: palette.background, borderWidth: 2, borderColor: palette.borderStrong, borderRadius: 12,
    color: palette.text, minHeight: 48, paddingHorizontal: 14, fontSize: 16 },
  hint: { color: palette.muted, fontSize: 12 },
  focused: { borderColor: palette.focus },
});
