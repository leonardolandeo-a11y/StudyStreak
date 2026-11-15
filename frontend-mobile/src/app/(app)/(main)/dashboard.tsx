import { AccessibilityInfo, Animated, Platform, Text, View, useWindowDimensions } from 'react-native';
import { useDashboardWidgets } from '../../../hooks/useDashboardWidgets';
import { RecordedCalendar } from '../../../components/dashboard/RecordedCalendar';
import { CustomizeDashboard } from '../../../components/dashboard/CustomizeDashboard';
import { DashboardPartners } from '../../../components/dashboard/DashboardPartners';
import { AcademicPanel } from '../../../components/academic/Academic';
import { ActionButton } from '../../../components/ui/ActionButton';
import { router, useFocusEffect, useIsFocused } from 'expo-router';
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
import { useWidgetDrag } from '../../../hooks/useWidgetDrag';
import { WidgetDragHandle } from '../../../components/dashboard/WidgetDragHandle';
import { AppIcon } from '../../../components/ui/AppIcon';
import type { WidgetId } from '../../../features/dashboard/widgetPreferences';
import { StatusMessage } from '../../../components/ui/StatusMessage';

export default function Dashboard() {
  const { currentUser } = useAuth();
  return currentUser ? <DashboardContent key={currentUser.id} userId={currentUser.id} /> : null;
}
function DashboardContent({ userId }: { userId: number }) {
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
  const [selectedId, setSelectedId] = useState<WidgetId | null>(null);
  const selectWidget = useCallback((id: WidgetId) => setSelectedId(current => current === id ? null : id), []);
  useFocusEffect(useCallback(() => () => setSelectedId(null), []));
  const [customizationOpen, setCustomizationOpen] = useState(false);
  const focused = useIsFocused();
  const [announcement, setAnnouncement] = useState('');
  const announce = useCallback((message: string) => {
    setAnnouncement(message); if (Platform.OS !== 'web') AccessibilityInfo.announceForAccessibility(message);
  }, []);
  const { drag, translation, translationX, scrollRef, viewportRef, contentRef, registerRow, onContentLayout, scrollProps, start, move, finish, accessibleMove } = useWidgetDrag({ rows: layout.rows, items: visibleWidgets, save: layout.save, announce, onSelect: selectWidget, enabled: focused && !customizationOpen });
  const targetFrame = drag?.frame;
  const retryWithoutChart = state.status === 'error' && !visibleWidgets.some(row => row.id === 'activity') &&
    visibleWidgets.some(row => ['focus-summary','streak','journey','recent','calendar'].includes(row.id));
  const period = stats ? verifiedActivity(stats, days) : null;
  return <Screen themed compact backgroundColor={colors.background} scrollRef={scrollRef} viewportRef={viewportRef} scrollProps={scrollProps} onRefresh={retry} refreshing={state.status === 'loading'}>
    <StudyEnvironment />
    <View testID="dashboard-heading" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><AppIcon name="dashboard" size={18} color={colors.primary}/><Text accessibilityRole="header" style={{ color: colors.text, fontSize: 22, fontWeight: '700' }}>Dashboard</Text></View>
        <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 12 }}>Your study progress at a glance.</Text>
      </View>
      <CustomizeDashboard selectedId={selectedId} onSelect={selectWidget} onOpenChange={setCustomizationOpen} {...layout}/>
    </View>
    {layout.error ? <View><StatusMessage error message={layout.error}/><ActionButton compact secondary title="Retry layout" onPress={() => { void layout.save(layout.rows); }}/></View> : null}
    {retryWithoutChart ? <AcademicPanel style={{ backgroundColor: dashboardPalette(theme).surface, borderColor: dashboardPalette(theme).border }}>
      <StatusMessage colors={dashboardPalette(theme)} error message="Study statistics could not be loaded. Your saved data has not changed."/>
      <ActionButton colors={dashboardPalette(theme)} compact title="Retry study statistics" onPress={retry}/>
    </AcademicPanel> : null}
    <Animated.View ref={contentRef} onLayout={onContentLayout} style={{ opacity: fade, flexDirection: 'row', flexWrap: 'wrap', gap: 14 }} testID="dashboard-widgets">
    {visibleWidgets.map((row,index) => <Animated.View testID={`widget-${row.id}`} key={row.id} onLayout={event => { registerRow(row.id, event.nativeEvent.layout); }} style={{ zIndex: drag?.id === row.id ? 2 : 0, opacity: drag?.id === row.id ? .75 : 1, transform: [{ translateY: drag?.id === row.id ? translation : 0 }, { translateX: drag?.id === row.id ? translationX : 0 }], minWidth: 0, width: width >= 700 && ['goals','partners','quick','streak'].includes(row.id) ? '48%' : '100%', flexGrow: 1 }}>
      <View style={{ minHeight: 44, alignItems: 'flex-end' }}><WidgetDragHandle compact selected={selectedId === row.id} labelPrefix="Move widget" id={row.id} index={index} count={visibleWidgets.length}
        start={start} move={move} finish={finish} onSelect={selectWidget} accessibleMove={accessibleMove}/></View>
      {selectedId === row.id ? <View testID="selected-widget-outline" pointerEvents="none" style={{ zIndex: 3, position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: 12, borderWidth: 2, borderColor: colors.primary }}/>: null}
      {row.id === 'focus-summary' && <DashboardActivity part="focus" days={days} onDaysChange={setDays} state={state} retry={retry}/>}
      {row.id === 'streak' && <DashboardActivity part="streak" days={days} onDaysChange={setDays} state={state} retry={retry}/>}
      {row.id === 'activity' && <DashboardActivity part="activity" days={days} onDaysChange={setDays} state={state} retry={retry}/>}
      {row.id === 'goals' && <DashboardGoals userId={userId}/>}
      {row.id === 'journey' && (stats ? <FocusInsightsMobile data={stats} days={days} calendarExternal={visibleWidgets.some(widget => widget.id === 'calendar')}/> : <StatusMessage message={state.status === 'loading' ? 'Loading study journey…' : 'Reload study activity to view your journey.'}/>)}
      {row.id === 'calendar' && (stats ? <RecordedCalendar activity={stats.activity}/> : <StatusMessage message={state.status === 'loading' ? 'Loading Activity Calendar…' : 'Reload study activity to view your calendar.'}/>)}
      {row.id === 'recent' && (period && stats ? <DashboardRecent from={period.daily[0].date} to={period.daily.at(-1)!.date} timeZone={stats.timeZone}/> : <StatusMessage message={state.status === 'loading' ? 'Loading your study period…' : 'Reload study activity to view recent attempts.'}/>)}
      {row.id === 'partners' && <DashboardPartners userId={userId}/>}
      {row.id === 'quick' && <AcademicPanel style={{ backgroundColor: dashboardPalette(theme).surface, borderColor: dashboardPalette(theme).border }}><Text accessibilityRole="header" style={{ color: dashboardPalette(theme).text, fontSize: 18, fontWeight: '700' }}>Quick Focus</Text><ActionButton compact title="Open Focus Studio" onPress={() => router.navigate('/focus-studio')}/></AcademicPanel>}
    </Animated.View>)}
    {drag && targetFrame ? <View testID="dashboard-drop-target" pointerEvents="none" style={{ position: 'absolute', zIndex: 4, height: 3, backgroundColor: colors.primary,
      left: targetFrame.x ?? 0, width: targetFrame.width ?? '100%', top: targetFrame.y + (drag.from < drag.target ? targetFrame.height : 0) }}/>: null}
    </Animated.View>
    {announcement ? <Text accessibilityLiveRegion="polite" style={{ color: colors.muted, fontSize: 12 }}>{announcement}</Text> : null}
    {!layout.rows.some(row => row.visible) ? <StatusMessage message="Your Dashboard is clear. Use Customize Dashboard to show widgets."/> : null}
  </Screen>;
}
