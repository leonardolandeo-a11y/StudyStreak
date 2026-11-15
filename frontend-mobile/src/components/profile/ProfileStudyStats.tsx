import { Text, View } from 'react-native';
import type { ProfileStatistics } from '../../services/ownProfileService';
import { useAppearance } from '../../hooks/useAppearance';
export function ProfileStudyStats({ statistics }: { statistics?: ProfileStatistics }) {
  const { theme } = useAppearance();
  if (!statistics) return null;
  const metrics = [
    { label: 'Verified focus time', value: statistics.verifiedMinutes, unit: ' min', detail: 'Lifetime confirmed individual & group focus' },
    { label: 'Verified sessions', value: statistics.verifiedSessions, detail: 'Completed & verified · excludes legacy' },
    { label: 'Active goals', value: statistics.activeGoals, detail: 'Goals still in progress' },
    { label: 'Current streak', value: statistics.studyStreak, unit: ' days', detail: 'Includes historical study records' },
    { label: 'Best streak', value: statistics.bestStudyStreak, unit: ' days', detail: 'Includes historical study records' },
  ];
  return <View style={{ gap: 10 }}>
    <Text accessibilityRole="header" style={{ color: theme.colors.text, fontWeight: '600', fontSize: 18 }}>Your study journey</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {metrics.filter(item => Number.isFinite(item.value) && item.value >= 0).map(item => <View key={item.label}
        style={{ flexGrow: 1, flexBasis: '45%', minWidth: 120, padding: 12, borderRadius: 8, gap: 6, backgroundColor: theme.colors.surface }}>
        <Text style={{ color: theme.colors.muted, fontSize: 13 }}>{item.label}</Text>
        <Text style={{ color: theme.colors.text, fontSize: 22, fontWeight: '700' }}>{new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(item.value)}{item.unit}</Text>
        <Text style={{ color: theme.colors.muted, fontSize: 12, lineHeight: 17 }}>{item.detail}</Text>
      </View>)}
    </View>
  </View>;
}
