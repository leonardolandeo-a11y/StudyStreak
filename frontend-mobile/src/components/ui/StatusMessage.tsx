import { StyleSheet, Text, View } from 'react-native';
import { palette } from '../../constants/palette';

export function StatusMessage({ message, error = false }: { message: string; error?: boolean }) {
  return (
    <View accessibilityRole="alert" style={[styles.box, error && styles.error]}>
      <Text style={[styles.text, error && styles.errorText]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: palette.surfaceRaised, borderRadius: 10, padding: 13 },
  error: { backgroundColor: '#4c1425', borderWidth: 1, borderColor: '#881337' },
  text: { color: palette.text, lineHeight: 20 },
  errorText: { color: palette.error },
});
