import { useState } from 'react';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { useAppearance } from '../../hooks/useAppearance';
import type { ResourceState } from '../../hooks/useFocusedResource';
import type { FocusStatistics } from '../../features/focus/focusStatisticsService';
import { activityNumber, verifiedActivity, type StudyPeriod } from '../../features/dashboard/verifiedActivity';
import { AcademicPanel as Card, AcademicEmpty, PixelGlyph } from '../academic/Academic';
import { ActionButton } from '../ui/ActionButton';
import { StatusMessage } from '../ui/StatusMessage';
import { ActivityPlot } from './ActivityPlot';
import { NavigationPressable } from '../navigation/NavigationPressable';
import { AppIcon } from '../ui/AppIcon';
import { SegmentedControl } from '../ui/SegmentedControl';

export function DashboardActivity({ days, onDaysChange, state, retry }: {
  days: StudyPeriod; onDaysChange(days: StudyPeriod): void; state: ResourceState<FocusStatistics>; retry(): void;
}) {
  const { theme } = useAppearance();
  const [style, setStyle] = useState<'bars' | 'lines'>('bars');
  const stats = state.status === 'success' ? state.data : null;
  const period = stats ? verifiedActivity(stats, days) : null;
  const missing = state.status === 'loading' ? '…' : '—';
  const metrics = [
    { label: 'Verified focus', value: period ? activityNumber(period.minutes) : missing, unit: 'min', detail: `Confirmed time · last ${days} days` },
    { label: 'Completed sessions', value: period ? activityNumber(period.sessions) : missing, unit: 'sessions', detail: `Verified individual & group · ${days} days` },
    { label: 'Daily average', value: period ? activityNumber(period.minutes / days) : missing, unit: 'min / day', detail: `Across all ${days} days, including days without activity` },
    { label: 'Current study streak', value: stats && Number.isSafeInteger(stats.studyStreak) && stats.studyStreak >= 0 ? activityNumber(stats.studyStreak) : missing,
      unit: 'days', detail: 'All completed study days, including historical estimates. Independent of the period above.' },
  ];
  return <>
    <Card style={{ padding: 14, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text accessibilityRole="header" style={{ color: theme.colors.text, fontSize: 20, fontWeight: '700' }}>Study activity</Text>
          <Text style={{ color: theme.colors.muted, fontSize: 12 }}>Daily focus · confirmed minutes{stats?.timeZone ? ` · ${stats.timeZone}` : ''}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 2 }}>
          {(['bars', 'lines'] as const).map(value => <NavigationPressable key={value} accessibilityRole="button"
            accessibilityLabel={value === 'bars' ? 'Bars' : 'Lines'} accessibilityState={{ selected: style === value }}
            onPress={() => setStyle(value)} style={{ width: 44, height: 44, borderRadius: 10,
              alignItems: 'center', justifyContent: 'center', backgroundColor: style === value ? theme.colors.primarySoft : 'transparent' }}>
            <AppIcon name={value} color={style === value ? theme.colors.primary : theme.colors.muted} size={20} />
          </NavigationPressable>)}
        </View>
      </View>
      <SegmentedControl options={[{ value: 7 as const, label: '7 days' }, { value: 30 as const, label: '30 days' }]}
        value={days} onChange={onDaysChange} />
      {state.status === 'loading' ? <StatusMessage message="Loading verified activity…" />
        : state.status === 'error' || !period ? <><StatusMessage error message={state.status === 'error'
          ? 'Your study activity could not be loaded.' : 'Verified activity is unavailable or inconsistent. Historical estimates have not been substituted.'} />
          <ActionButton title="Retry activity" onPress={retry} /></>
        : period.minutes === 0 ? <><AcademicEmpty><StatusMessage message="No verified study time in this period." /></AcademicEmpty>
          <ActionButton title="Start focusing" onPress={() => router.navigate('/focus-studio')} /></>
        : <ActivityPlot period={period} style={style} />}
      <Text style={{ color: theme.colors.muted, fontSize: 12, lineHeight: 18 }}>Only completed, server-verified sessions count here. Historical estimates, breaks and unfinished attempts are excluded. Days follow your account time zone.</Text>
    </Card>
    {metrics.map((metric,index) => <Card key={metric.label} style={{ padding: 12, gap: 4 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}><PixelGlyph name={(['chart','spark','lamp','book'] as const)[index]} size={20} /><Text accessibilityRole="header" style={{ color: theme.colors.textSecondary, fontSize: 14, flexShrink: 1 }}>{metric.label}</Text></View>
        <Text style={{ color: theme.colors.text, fontSize: 22, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{metric.value} <Text style={{ color: theme.colors.muted, fontSize: 12 }}>{metric.unit}</Text></Text>
      </View>
      <Text style={{ color: theme.colors.muted, fontSize: 12, lineHeight: 18 }}>{metric.detail}</Text>
    </Card>)}
  </>;
}
