import { StyleSheet, Text, View } from 'react-native';
import { ActionButton } from './ActionButton';
import { palette } from '../../constants/palette';

export function PageControls({ page, totalPages, onChange }: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
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

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  action: { flex: 1 },
  count: { color: palette.muted, textAlign: 'center', fontSize: 13 },
});
