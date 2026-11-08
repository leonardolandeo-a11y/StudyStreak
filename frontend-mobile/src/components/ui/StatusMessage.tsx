import { StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '../../hooks/useAppearance';
import type { ThemeColors } from '../../features/appearance/theme';

export function StatusMessage({ message, error = false, variant = 'info' }: {
  message: string; error?: boolean; variant?: 'info' | 'success';
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <View accessibilityRole={error ? 'alert' : undefined} accessibilityLiveRegion={error ? 'assertive' : 'polite'}
      style={[styles.box, variant === 'success' && styles.success, error && styles.error]}>
      <Text style={[styles.text, variant === 'success' && styles.successText, error && styles.errorText]}>{message}</Text>
    </View>
  );
}

const createStyles = (palette: ThemeColors) => StyleSheet.create({
  box: { backgroundColor: palette.infoSurface, borderRadius: 12, padding: 13 },
  error: { backgroundColor: palette.errorSurface, borderWidth: 1, borderColor: palette.errorBorder },
  text: { color: palette.info, lineHeight: 22 },
  errorText: { color: palette.error },
  success: { backgroundColor: palette.successSurface },
  successText: { color: palette.success },
});
