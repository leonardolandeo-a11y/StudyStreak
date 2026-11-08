import { useCallback, useState } from 'react';
import { AppState, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getMobileFocusStatistics } from '../../features/focus/focusStatisticsService';
import { verifiedActivity, activityNumber } from '../../features/dashboard/verifiedActivity';
import { useFocusedResource } from '../../hooks/useFocusedResource';
import { useAppearance } from '../../hooks/useAppearance';
import { MetricCard } from '../study/MetricCard';
import { ActionButton } from '../ui/ActionButton';
import { StatusMessage } from '../ui/StatusMessage';
import { SegmentedControl } from '../ui/SegmentedControl';
import { StudyAnalyticsDetails } from './StudyAnalyticsDetails';

export function FocusInsightsMobile({ refreshKey = 0 }: { refreshKey?: number }) {
  const [days, setDays] = useState<7 | 30>(7);
  return <View style={{ gap: 12 }}>
    <SegmentedControl<7 | 30> options={[{ value: 7, label: '7 days' }, { value: 30, label: '30 days' }]} value={days} onChange={setDays} />
    <InsightsData key={`${days}-${refreshKey}`} days={days} />
  </View>;
}
function InsightsData({ days }: { days: 7 | 30 }) {
  const { theme } = useAppearance();
  const load = useCallback((signal: AbortSignal) => getMobileFocusStatistics(days, signal), [days]);
  const { state, retry } = useFocusedResource(load);
  useFocusEffect(useCallback(() => {
    const refresh = () => { if (AppState.currentState === 'active') retry(); };
    const timer = setInterval(refresh, 30000);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') refresh(); });
    return () => { clearInterval(timer); listener.remove(); };
  }, [retry]));
  if (state.status === 'loading') return <StatusMessage message="Loading saved study statistics…" />;
  if (state.status === 'error') return <><StatusMessage error message="Statistics unavailable. Pending time has not been added." /><ActionButton title="Retry statistics" secondary onPress={retry} /></>;
  const data = state.data;
  const verified = verifiedActivity(data, days);
  return <View style={{ gap: 12 }}>
    <Text style={{ color: theme.colors.muted, fontSize: 12 }}>Server-confirmed snapshot · {data.timeZone}. Pending time excluded.</Text>
    {verified ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      <MetricCard label="Verified focus" value={`${activityNumber(verified.minutes)} min`} detail={`Last ${days} days · verified only`} />
      <MetricCard label="Verified sessions" value={verified.sessions} detail={`Individual & group · ${days} days`} />
    </View> : <StatusMessage message="Verified period unavailable. Historical time is not used as a substitute." />}
    <Text style={{ color: theme.colors.muted, fontSize: 12 }}>All-time: {activityNumber(data.verifiedMinutes)} verified min · {activityNumber(data.estimatedMinutes)} min historical estimates.</Text>
    <StudyAnalyticsDetails data={data} />
  </View>;
}
