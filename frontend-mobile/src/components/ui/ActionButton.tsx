import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { useState } from 'react';
import { useAppearance, useThemedStyles } from '../../hooks/useAppearance';
import type { ThemeColors } from '../../features/appearance/theme';

export function ActionButton({ title, onPress, busy = false, disabled = false, secondary = false, selected, compact = false }: {
  title: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  secondary?: boolean;
  selected?: boolean;
  compact?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const { theme } = useAppearance();
  const palette = theme.colors;
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || busy, busy, selected }}
      disabled={disabled || busy} onPress={onPress}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={({ pressed }) => [styles.button, compact && styles.compact, secondary && styles.secondary, selected && styles.selected,
        focused && styles.focused, (pressed || disabled || busy) && styles.dim]}>
      {busy ? <ActivityIndicator color={secondary ? palette.text : palette.primaryText} /> :
        <Text style={[styles.text, compact && styles.compactText, secondary && styles.secondaryText, selected && styles.selectedText]}>{title}</Text>}
    </Pressable>
  );
}

const createStyles = (palette: ThemeColors) => StyleSheet.create({
  button: { backgroundColor: palette.primary, borderRadius: 12, borderWidth: 2, borderColor: 'transparent', minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  secondary: { backgroundColor: palette.surfaceRaised, borderColor: palette.borderStrong },
  selected: { backgroundColor: palette.primarySoft, borderColor: palette.primary },
  selectedText: { color: palette.primary },
  focused: { borderColor: palette.focus, outlineColor: palette.focus, outlineWidth: 2, outlineOffset: 2 },
  text: { color: palette.primaryText, fontSize: 15, fontWeight: '700', textAlign: 'center', flexShrink: 1 },
  secondaryText: { color: palette.text },
  compact: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  compactText: { fontSize: 13 },
  dim: { opacity: 0.62 },
});
