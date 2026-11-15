import { Animated, Text, View, useWindowDimensions } from 'react-native';
import { useDashboardWidgets } from '../../../hooks/useDashboardWidgets';
import { RecordedCalendar } from '../../../components/dashboard/RecordedCalendar';
import { CustomizeDashboard } from '../../../components/dashboard/CustomizeDashboard';
import { DashboardPartners } from '../../../components/dashboard/DashboardPartners';
import { AcademicPanel } from '../../../components/academic/Academic';
import { ActionButton } from '../../../components/ui/ActionButton';
import { router } from 'expo-router';
import { StudyEnvironment } from '../../../components/environment/StudyEnvironment';
import { workspacePalette, dashboardPalette } from '../../../components/academic/workspacePalette';
import { useAppearance } from '../../../hooks/useAppearance';
import { Screen } from '../../../components/ui/Screen';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useFocusedResource } from '../../../hooks/useFocusedResource';
import { getMobileFocusStatistics } from '../../../features/focus/focusStatisticsService';
import { verifiedActivity, type StudyPeriod } from '../../../features/dashboard/verifiedActivity';
import { FocusInsightsMobile } from '../../../components/focus/FocusInsightsMobile';
import { DashboardActivity } from '../../../components/dashboard/DashboardActivity';
import { DashboardGoals, DashboardRecent } from '../../../components/dashboard/DashboardContext';
import { StatusMessage } from '../../../components/ui/StatusMessage';

export default function Dashboard() {
  const { currentUser } = useAuth();
  return currentUser ? <DashboardContent key={currentUser.id} userId={currentUser.id} username={currentUser.username} /> : null;
}
function DashboardContent({ userId, username }: { userId: number; username: string }) {
  const { theme, reduceMotion } = useAppearance();
  const { width } = useWindowDimensions();
  const layout = useDashboardWidgets(userId);
  const [fade] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (reduceMotion) { fade.setValue(1); return; }
    fade.setValue(.7);
    const animation = Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true, isInteraction: false });
    animation.start(); return () => { animation.stop(); fade.stopAnimation(); };
  }, [layout.rows, reduceMotion, fade]);
  const colors = workspacePalette(theme);
  const [days, setDays] = useState<StudyPeriod>(7);
  const load = useCallback((signal: AbortSignal) => getMobileFocusStatistics(days, signal), [days]);
  const { state, retry } = useFocusedResource(load);
  const stats = state.status === 'success' ? state.data : null;
  const visibleWidgets = layout.ready ? layout.rows.filter(row => row.visible) : [];
  const retryWithoutChart = state.status === 'error' && !visibleWidgets.some(row => row.id === 'activity') &&
    visibleWidgets.some(row => ['focus-summary','streak','journey','recent','calendar'].includes(row.id));
  const period = stats ? verifiedActivity(stats, days) : null;
  return <Screen themed compact backgroundColor={colors.background} onRefresh={retry} refreshing={state.status === 'loading'}>
    <StudyEnvironment username={username} />
    <CustomizeDashboard {...layout}/>
    {retryWithoutChart ? <AcademicPanel style={{ backgroundColor: dashboardPalette(theme).surface, borderColor: dashboardPalette(theme).border }}>
      <StatusMessage colors={dashboardPalette(theme)} error message="Study statistics could not be loaded. Your saved data has not changed."/>
      <ActionButton colors={dashboardPalette(theme)} compact title="Retry study statistics" onPress={retry}/>
    </AcademicPanel> : null}
    <Animated.View style={{ opacity: fade, flexDirection: 'row', flexWrap: 'wrap', gap: 14 }} testID="dashboard-widgets">
    {visibleWidgets.map(row => <View testID={`widget-${row.id}`} key={row.id} style={{ minWidth: 0, width: width >= 700 && ['goals','partners','quick','streak'].includes(row.id) ? '48%' : '100%', flexGrow: 1 }}>
      {row.id === 'focus-summary' && <DashboardActivity part="focus" days={days} onDaysChange={setDays} state={state} retry={retry}/>}
      {row.id === 'streak' && <DashboardActivity part="streak" days={days} onDaysChange={setDays} state={state} retry={retry}/>}
      {row.id === 'activity' && <DashboardActivity part="activity" days={days} onDaysChange={setDays} state={state} retry={retry}/>}
      {row.id === 'goals' && <DashboardGoals userId={userId}/>}
      {row.id === 'journey' && (stats ? <FocusInsightsMobile data={stats} days={days} calendarExternal={visibleWidgets.some(widget => widget.id === 'calendar')}/> : <StatusMessage message={state.status === 'loading' ? 'Loading study journey…' : 'Reload study activity to view your journey.'}/>)}
      {row.id === 'calendar' && (stats ? <RecordedCalendar activity={stats.activity}/> : <StatusMessage message={state.status === 'loading' ? 'Loading Activity Calendar…' : 'Reload study activity to view your calendar.'}/>)}
      {row.id === 'recent' && (period && stats ? <DashboardRecent from={period.daily[0].date} to={period.daily.at(-1)!.date} timeZone={stats.timeZone}/> : <StatusMessage message={state.status === 'loading' ? 'Loading your study period…' : 'Reload study activity to view recent attempts.'}/>)}
      {row.id === 'partners' && <DashboardPartners userId={userId}/>}
      {row.id === 'quick' && <AcademicPanel style={{ backgroundColor: dashboardPalette(theme).surface, borderColor: dashboardPalette(theme).border }}><Text accessibilityRole="header" style={{ color: dashboardPalette(theme).text, fontSize: 18, fontWeight: '700' }}>Quick Focus</Text><ActionButton compact title="Open Focus Studio" onPress={() => router.navigate('/focus-studio')}/></AcademicPanel>}
    </View>)}
    </Animated.View>
    {!layout.rows.some(row => row.visible) ? <StatusMessage message="Your Dashboard is clear. Use Customize Dashboard to show widgets."/> : null}
  </Screen>;
}
