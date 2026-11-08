import { StyleSheet, Text, View } from 'react-native';
import { ActionButton } from './ActionButton';
import { useThemedStyles } from '../../hooks/useAppearance';
import type { ThemeColors } from '../../features/appearance/theme';

export function PageControls({ page, totalPages, onChange }: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  const styles = useThemedStyles(createStyles);
  if (totalPages < 2) return null;
  return (
    <View style={styles.row}>
      <View style={styles.action}>
        <ActionButton title="Previous" secondary disabled={page === 0} onPress={() => onChange(page - 1)} />
      </View>
      <Text style={styles.count}>{page + 1} / {totalPages}</Text>
      <View style={styles.action}>
        <ActionButton title="Next" secondary disabled={page + 1 >= totalPages} onPress={() => onChange(page + 1)} />
      </View>
    </View>
  );
}

const createStyles = (palette: ThemeColors) => StyleSheet.create({
  row: { backgroundColor: palette.surface, padding: 8, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  action: { flex: 1 },
  count: { color: palette.muted, textAlign: 'center', fontSize: 13 },
});
