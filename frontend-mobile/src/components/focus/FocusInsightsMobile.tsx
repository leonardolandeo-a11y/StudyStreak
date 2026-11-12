import { useState } from 'react';
import { Text, View } from 'react-native';
import type { FocusStatistics } from '../../features/focus/focusStatisticsService';
import { activityNumber } from '../../features/dashboard/verifiedActivity';
import { useAppearance } from '../../hooks/useAppearance';
import { AcademicSprite } from '../academic/AcademicSprite';
import { workspacePalette } from '../academic/workspacePalette';
import { NavigationPressable } from '../navigation/NavigationPressable';
import { AcademicPanel } from '../academic/Academic';
import { StudyAnalyticsDetails } from './StudyAnalyticsDetails';

/** Presentation only: shares the Dashboard request, period and refresh. */
export function FocusInsightsMobile({ data, days }: { data: FocusStatistics; days: 7 | 30 }) {
  const { theme } = useAppearance();
  const colors = workspacePalette(theme);
  const [expanded, setExpanded] = useState(false);
  const metrics = [
    { label: 'All-time recorded', value: `${activityNumber(data.totalMinutes)} min`, detail: `${activityNumber(data.verifiedMinutes)} min verified · ${activityNumber(data.estimatedMinutes)} min historical estimates` },
    { label: 'All-time completed sessions', value: data.completedSessions, detail: 'Across all Goals · recorded sessions' },
    { label: `Recorded in ${days} days`, value: `${activityNumber(data.periodMinutes)} min`, detail: `${data.periodSessions} sessions · includes historical estimates` },
    { label: 'This week', value: `${activityNumber(data.weekMinutes)} min`, detail: 'Monday through today · recorded time' },
  ];
  return <AcademicPanel style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}><AcademicSprite name="books" width={60}/><View style={{ flex: 1, gap: 4 }}>
      <Text accessibilityRole="header" style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>Your study journey</Text>
      <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}>Saved sessions · {data.timeZone}. Pending time excluded.</Text>
    </View></View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {metrics.map(metric => <View key={metric.label} style={{ flexBasis: '45%', flexGrow: 1, minWidth: 110, paddingLeft: 10, borderLeftWidth: 1, borderColor: colors.borderStrong, gap: 4 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{metric.label}</Text><Text style={{ color: colors.text, fontSize: 23, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{metric.value}</Text><Text style={{ color: colors.muted, fontSize: 11, lineHeight: 16 }}>{metric.detail}</Text>
      </View>)}
    </View>
    <NavigationPressable accessibilityRole="button" accessibilityLabel={expanded ? 'Hide study details' : 'Explore study details'} accessibilityState={{ expanded }} aria-expanded={expanded} onPress={() => setExpanded(value => !value)} style={{ minHeight: 48, justifyContent: 'center', paddingHorizontal: 8, borderRadius: 8 }}><Text style={{ color: colors.primary, fontWeight: '600' }}>{expanded ? 'Hide study details' : 'Explore study details'}</Text></NavigationPressable>
    {expanded ? <StudyAnalyticsDetails key={days} data={data}/> : null}
  </AcademicPanel>;
}
