import { useCallback } from 'react';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { useAppearance } from '../../hooks/useAppearance';
import { useFocusedResource } from '../../hooks/useFocusedResource';
import { listActiveFocusGoals } from '../../features/focus/focusGoalService';
import { getRecentStudySessions } from '../../services/dashboardActivityService';
import { activityDate, activityNumber } from '../../features/dashboard/verifiedActivity';
import { Card } from '../ui/Card';
import { ActionButton } from '../ui/ActionButton';
import { StatusMessage } from '../ui/StatusMessage';
import { NavigationPressable } from '../navigation/NavigationPressable';

export function DashboardGoals({ userId }: { userId: number }) {
  const { theme } = useAppearance();
  const load = useCallback((signal: AbortSignal) => listActiveFocusGoals(userId, signal), [userId]);
  const { state, retry } = useFocusedResource(load);
  return <Card style={{ padding: 16 }}>
    <Text accessibilityRole="header" style={{ color: theme.colors.text, fontSize: 18, fontWeight: '700' }}>Your active goals</Text>
    <ActionButton title="All goals" secondary onPress={() => router.navigate('/goals')} />
    {state.status === 'loading' ? <StatusMessage message="Loading your goals…" />
      : state.status === 'error' ? <><StatusMessage error message="Your goals could not be loaded." /><ActionButton title="Retry goals" onPress={retry} /></>
      : state.data.length === 0 ? <StatusMessage message="Create your first study goal from Menu using +." /> : <>
        {state.data.slice(0, 3).map(goal => <NavigationPressable key={goal.id} accessibilityRole="button"
          accessibilityLabel={`Open ${goal.topic}`} onPress={() => router.push({ pathname: '/(app)/goals/[goalId]', params: { goalId: String(goal.id) } })}
          style={{ padding: 12, borderRadius: 12, gap: 6, backgroundColor: theme.colors.background }}>
          <Text style={{ color: theme.colors.primary, fontSize: 16, fontWeight: '600' }}>{goal.topic}</Text>
          <Text style={{ color: theme.colors.muted, fontSize: 12 }}>Target: {goal.frequency} times / week · {goal.duration} min / session</Text>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>Study records and progress ›</Text>
        </NavigationPressable>)}
        <Text style={{ color: theme.colors.muted, fontSize: 12 }}>{state.data.length} active goals. Targets are your plan; confirmed session time appears above.</Text>
      </>}
  </Card>;
}
export function DashboardRecent({ from, to, timeZone }: { from: string; to: string; timeZone: string }) {
  const { theme } = useAppearance();
  const load = useCallback((signal: AbortSignal) => getRecentStudySessions(from, to, signal), [from, to]);
  const { state, retry } = useFocusedResource(load);
  return <Card style={{ padding: 16 }}>
    <Text accessibilityRole="header" style={{ color: theme.colors.text, fontSize: 18, fontWeight: '700' }}>Recent study activity</Text>
    <Text style={{ color: theme.colors.muted, fontSize: 12, lineHeight: 18 }}>Started {activityDate(from)} – {activityDate(to)} · {timeZone}. Chart uses completion dates.</Text>
    {state.status === 'loading' ? <StatusMessage message="Loading recent activity…" />
      : state.status === 'error' ? <><StatusMessage error message="Recent activity could not be loaded." /><ActionButton title="Retry recent activity" onPress={retry} /></>
      : state.data.length === 0 ? <StatusMessage message="No study attempts started in this period." />
        : state.data.map(session => <View key={session.id} style={{ borderBottomWidth: 1, borderColor: theme.colors.border, paddingVertical: 10, gap: 5 }}>
          <Text style={{ color: theme.colors.text, fontWeight: '600', fontSize: 15 }}>{session.goal_name}</Text>
          <Text style={{ color: theme.colors.muted, fontSize: 12 }}>{({ COMPLETE: 'Complete', CANCELLED: 'Cancelled', PAUSED: 'Paused', RUNNING: 'Running' })[session.state] ?? 'State unavailable'} · {Number.isFinite(session.confirmed_seconds) && session.confirmed_seconds >= 0 ? activityNumber(session.confirmed_seconds / 60) : '—'} min saved</Text>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>{session.source === 'LEGACY' || !session.verified ? 'Historical / unverified' : session.source === 'GROUP' ? 'Group · server observed' : 'Individual · server observed'}</Text>
          <Text style={{ color: theme.colors.muted, fontSize: 12 }}>{sessionDate(session.started_at, timeZone)}</Text>
        </View>)}
    <ActionButton title="Explore sessions in Focus Studio" secondary onPress={() => router.navigate('/focus-studio')} />
  </Card>;
}
function sessionDate(date: string, timeZone: string) {
  try { return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone }).format(new Date(date)); }
  catch { return 'Date unavailable'; }
}
