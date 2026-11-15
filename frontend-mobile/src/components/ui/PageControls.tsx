import { StyleSheet, Text, View } from 'react-native';
import { ActionButton } from './ActionButton';
import { AppIcon } from './AppIcon';
import { NavigationPressable } from '../navigation/NavigationPressable';
import { useAppearance, useThemedStyles } from '../../hooks/useAppearance';
import type { ThemeColors } from '../../features/appearance/theme';

export function PageControls({ page, totalPages, onChange, compact = false }: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  compact?: boolean;
}) {
  const styles = useThemedStyles(createStyles);
  const { theme: { colors } } = useAppearance();
  if (totalPages < 2) return null;
  if (compact) return <View style={styles.row}>
    <NavigationPressable accessibilityRole="button" accessibilityLabel="Previous" accessibilityState={{disabled:page===0}} disabled={page===0} onPress={()=>onChange(page-1)} style={{minWidth:44,minHeight:44,alignItems:'center',justifyContent:'center',opacity:page === 0 ? .45 : 1}}><AppIcon name="chevron-left" color={colors.primary}/></NavigationPressable>
    <Text style={styles.count}>{page+1} / {totalPages}</Text>
    <NavigationPressable accessibilityRole="button" accessibilityLabel="Next" accessibilityState={{disabled:page+1>=totalPages}} disabled={page+1>=totalPages} onPress={()=>onChange(page+1)} style={{minWidth:44,minHeight:44,alignItems:'center',justifyContent:'center',opacity:page + 1 >= totalPages ? .45 : 1}}><AppIcon name="chevron-right" color={colors.primary}/></NavigationPressable>
  </View>;
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
