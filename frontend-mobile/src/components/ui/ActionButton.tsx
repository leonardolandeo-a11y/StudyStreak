import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { palette } from '../../constants/palette';

export function ActionButton({ title, onPress, busy = false, disabled = false, secondary = false }: {
  title: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title}
      disabled={disabled || busy} onPress={onPress}
      style={({ pressed }) => [styles.button, secondary && styles.secondary, (pressed || disabled || busy) && styles.dim]}>
      {busy ? <ActivityIndicator color={secondary ? palette.text : palette.primaryText} /> :
        <Text style={[styles.text, secondary && styles.secondaryText]}>{title}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { backgroundColor: palette.primary, borderRadius: 12, minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  secondary: { backgroundColor: palette.surfaceRaised, borderWidth: 1, borderColor: palette.border },
  text: { color: palette.primaryText, fontSize: 15, fontWeight: '700' },
  secondaryText: { color: palette.text },
  dim: { opacity: 0.62 },
});
