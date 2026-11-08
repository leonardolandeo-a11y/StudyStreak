import { useState } from 'react';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { useAppearance } from '../../hooks/useAppearance';
import type { ResourceState } from '../../hooks/useFocusedResource';
import type { FocusStatistics } from '../../features/focus/focusStatisticsService';
import { activityNumber, verifiedActivity, type StudyPeriod } from '../../features/dashboard/verifiedActivity';
import { Card } from '../ui/Card';
import { ActionButton } from '../ui/ActionButton';
import { StatusMessage } from '../ui/StatusMessage';
import { ActivityPlot } from './ActivityPlot';
import { NavigationPressable } from '../navigation/NavigationPressable';

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
    <Card style={{ padding: 16, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text accessibilityRole="header" style={{ color: theme.colors.text, fontSize: 20, fontWeight: '700' }}>Study activity</Text>
          <Text style={{ color: theme.colors.muted, fontSize: 12 }}>Daily focus · confirmed minutes{stats?.timeZone ? ` · ${stats.timeZone}` : ''}</Text>
        </View>
        <NavigationPressable accessibilityRole="button" accessibilityLabel="Refresh activity" onPress={retry}
          style={{ width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surfaceRaised }}>
          <Text accessible={false} style={{ color: theme.colors.primary, fontSize: 24 }}>↻</Text>
        </NavigationPressable>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {([7, 30] as const).map(value => <ActionButton key={value} title={`${value} days`} secondary selected={days === value} onPress={() => onDaysChange(value)} />)}
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <ActionButton title="Bars" secondary selected={style === 'bars'} onPress={() => setStyle('bars')} />
          <ActionButton title="Lines" secondary selected={style === 'lines'} onPress={() => setStyle('lines')} />
        </View>
      </View>
      {state.status === 'loading' ? <StatusMessage message="Loading verified activity…" />
        : state.status === 'error' || !period ? <><StatusMessage error message={state.status === 'error'
          ? 'Your study activity could not be loaded.' : 'Verified activity is unavailable or inconsistent. Historical estimates have not been substituted.'} />
          <ActionButton title="Retry activity" onPress={retry} /></>
        : period.minutes === 0 ? <><StatusMessage message="No verified study time in this period." />
          <ActionButton title="Start focusing" onPress={() => router.navigate('/focus-studio')} /></>
        : <ActivityPlot period={period} style={style} />}
      <Text style={{ color: theme.colors.muted, fontSize: 12, lineHeight: 18 }}>Only completed, server-verified sessions count here. Historical estimates, breaks and unfinished attempts are excluded. Days follow your account time zone.</Text>
    </Card>
    {metrics.map(metric => <Card key={metric.label} style={{ padding: 16, gap: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <Text accessibilityRole="header" style={{ color: theme.colors.textSecondary, fontSize: 14 }}>{metric.label}</Text>
        <Text style={{ color: theme.colors.text, fontSize: 22, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{metric.value} <Text style={{ color: theme.colors.muted, fontSize: 12 }}>{metric.unit}</Text></Text>
      </View>
      <Text style={{ color: theme.colors.muted, fontSize: 12, lineHeight: 18 }}>{metric.detail}</Text>
    </Card>)}
  </>;
}
