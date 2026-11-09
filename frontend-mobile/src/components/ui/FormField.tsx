import { useState, type ComponentProps } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useAppearance, useThemedStyles } from '../../hooks/useAppearance';
import type { ThemeColors } from '../../features/appearance/theme';

type FieldProps = ComponentProps<typeof TextInput> & { label: string; hint?: string; variant?: 'default' | 'subtle' };

export function FormField({ label, hint, variant = 'default', ...props }: FieldProps) {
  const [focused, setFocused] = useState(false);
  const { theme } = useAppearance();
  const palette = theme.colors;
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.wrap, variant === 'subtle' && styles.subtleWrap]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput {...props} accessibilityLabel={label} placeholderTextColor={palette.muted}
        selectionColor={palette.primary} keyboardAppearance={theme.mode}
        underlineColorAndroid={variant === 'subtle' ? 'transparent' : props.underlineColorAndroid}
        onFocus={event => { setFocused(true); props.onFocus?.(event); }}
        onBlur={event => { setFocused(false); props.onBlur?.(event); }}
        style={[styles.input, variant === 'subtle' && styles.subtleInput, props.style, focused && styles.focused]} />
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
  subtleWrap: { backgroundColor: 'transparent', borderRadius: 0, gap: 4 },
  subtleInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, outlineWidth: 0 },
  focused: { borderColor: palette.focus },
});
