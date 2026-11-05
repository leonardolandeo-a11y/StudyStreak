import { StyleSheet, Text, View } from 'react-native';
import { palette } from '../../constants/palette';
export function MetricCard({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return <View style={styles.card}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text><Text style={styles.detail}>{detail}</Text></View>;
}
const styles = StyleSheet.create({
  card: { flexGrow: 1, flexBasis: '45%', minWidth: 130, gap: 8, padding: 16, borderRadius: 16, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border },
  label: { color: palette.muted, fontSize: 14 }, value: { color: palette.text, fontSize: 30, fontWeight: '700', fontVariant: ['tabular-nums'] }, detail: { color: palette.muted, fontSize: 13, lineHeight: 19 },
});
