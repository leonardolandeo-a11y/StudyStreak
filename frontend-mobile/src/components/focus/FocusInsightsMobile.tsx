import { useState } from 'react';
import { Text, View } from 'react-native';
import type { FocusStatistics } from '../../features/focus/focusStatisticsService';
import { activityNumber } from '../../features/dashboard/verifiedActivity';
import { useAppearance } from '../../hooks/useAppearance';
import { MetricCard } from '../study/MetricCard';
import { NavigationPressable } from '../navigation/NavigationPressable';
import { AcademicPanel } from '../academic/Academic';
import { StudyAnalyticsDetails } from './StudyAnalyticsDetails';

/** Presentation only: shares the Dashboard request, period and refresh. */
export function FocusInsightsMobile({ data, days }: { data: FocusStatistics; days: 7 | 30 }) {
  const { theme } = useAppearance();
  const [expanded, setExpanded] = useState(false);
  return <AcademicPanel>
    <Text accessibilityRole="header" style={{ color: theme.colors.text, fontSize: 20, fontWeight: '700' }}>Time well spent.</Text>
    <Text style={{ color: theme.colors.muted, fontSize: 12, lineHeight: 18 }}>Saved sessions · {data.timeZone}. Recorded totals include labelled historical estimates. Pending time excluded.</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      <MetricCard label="All-time recorded" value={`${activityNumber(data.totalMinutes)} min`} detail={`${activityNumber(data.verifiedMinutes)} min verified · ${activityNumber(data.estimatedMinutes)} min historical estimates`}/>
      <MetricCard label="All-time completed sessions" value={data.completedSessions} detail="Across all Goals · recorded sessions"/>
      <MetricCard label={`Recorded in ${days} days`} value={`${activityNumber(data.periodMinutes)} min`} detail={`${data.periodSessions} sessions · includes historical estimates`}/>
      <MetricCard label="This week" value={`${activityNumber(data.weekMinutes)} min`} detail="Monday through today · recorded time"/>
    </View>
    <NavigationPressable accessibilityRole="button" accessibilityLabel={expanded ? 'Hide study details' : 'Explore study details'} accessibilityState={{ expanded }} aria-expanded={expanded} onPress={() => setExpanded(value => !value)} style={{ minHeight: 48, justifyContent: 'center', paddingHorizontal: 8, borderRadius: 8 }}><Text style={{ color: theme.colors.primary, fontWeight: '600' }}>{expanded ? 'Hide study details' : 'Explore study details'}</Text></NavigationPressable>
    {expanded ? <StudyAnalyticsDetails key={days} data={data}/> : null}
  </AcademicPanel>;
}
