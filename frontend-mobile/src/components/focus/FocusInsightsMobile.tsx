import { StudyAnalyticsDetails } from "./StudyAnalyticsDetails";
import { useCallback, useEffect, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  displayFocusDuration, getMobileFocusStatistics,
} from '../../features/focus/focusStatisticsService';
import type { FocusStatistics } from '../../features/focus/focusStatisticsService';

function Metric({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricDetail}>{detail}</Text>
    </View>
  );
}

/** Displays only backend-confirmed minutes; unsynced timer minutes are never charted. */
export function FocusInsightsMobile({ refreshKey = 0 }: { refreshKey?: number }) {
  const [days, setDays] = useState<7 | 30>(7);
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState<FocusStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    void refreshKey;
    void revision;
    const controller = new AbortController();
    void Promise.resolve().then(() => {
      if (controller.signal.aborted) return;
      setLoading(true);
      setError(null);
      void getMobileFocusStatistics(days, controller.signal).then(stats => {
        if (!controller.signal.aborted) setData(stats);
      }).catch(() => {
        if (!controller.signal.aborted) setError('Unable to load study statistics.');
      }).finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    });
    return () => controller.abort();
  }, [days, refreshKey, revision]));

  useEffect(() => {
    const interval = setInterval(() => setRevision(value => value + 1), 30000);
    return () => clearInterval(interval);
  }, []);
  const maxDaily = Math.max(1, ...(data?.daily.map(day => day.minutes) ?? []));
  const maxGoal = Math.max(1, ...(data?.byGoal.map(goal => goal.minutes) ?? []));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Study statistics</Text>
      <Text style={styles.subtitle}>Your confirmed study time, synced across Web and Mobile.</Text>
      <View style={styles.tabs}>
        {([7, 30] as const).map(option => (
          <Pressable key={option} accessibilityRole="button"
            accessibilityState={{ selected: option === days }}
            onPress={() => { setDays(option); setData(null); }}
            style={[styles.tab, days === option && styles.tabSelected]}>
            <Text style={[styles.tabText, days === option && styles.tabTextSelected]}>{option} days</Text>
          </Pressable>
        ))}
        <Pressable accessibilityRole="button" accessibilityLabel="Refresh study statistics"
          onPress={() => setRevision(value => value + 1)} style={styles.refresh}>
          <Text style={styles.refreshText}>↻ Refresh</Text>
        </Pressable>
      </View>
      {loading && <ActivityIndicator color="#4ade80" />}
      {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      {data && (
        <>
          <View style={styles.metricGrid}>
            <Metric title="All-time focus" value={displayFocusDuration(data.totalMinutes)}
              detail="Time saved in Goals" />
            <Metric title="Completed sessions" value={String(data.completedSessions)}
              detail="All Goals" />
            <Metric title={`Last ${days} days`} value={displayFocusDuration(data.periodMinutes)}
              detail={`${data.periodSessions} sessions`} />
            <Metric title="Best day" value={displayFocusDuration(data.bestDayMinutes)}
              detail="In selected period" />
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.chartHeading}>Daily focus minutes</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chartScroller}>
              <View style={styles.chart}>
                {data.daily.map((day, index) => (
                  <View key={day.date} style={[styles.barColumn, { width: days === 30 ? 18 : 32 }]}>
                    <View style={styles.barSpace}>
                      <View style={[
                        styles.bar, day.minutes === 0 && styles.barEmpty,
                        { height: Math.max(3, 110 * day.minutes / maxDaily) },
                      ]} />
                    </View>
                    <Text style={styles.dayText}>
                      {days === 7 || index % 5 === 0 || index === data.daily.length - 1
                        ? day.date.slice(5) : ' '}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
            <StudyAnalyticsDetails key={days} data={data}/>
            <Text style={styles.subtitle}>A bar represents minutes saved on that date in your account time zone.</Text>
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.chartHeading}>Time by Goal</Text>
            {data.byGoal.length === 0
              ? <Text style={styles.subtitle}>Finish a linked Pomodoro to start tracking your Goals.</Text>
              : data.byGoal.slice(0, 6).map(goal => (
                <Pressable key={`${goal.goalId}-${goal.topic}`} accessibilityRole="button"
                  onPress={() => goal.goalId !== null && router.push({ pathname: '/(app)/goals/[goalId]',
                    params: { goalId: String(goal.goalId) } })} style={styles.goalItem}>
                  <View style={styles.goalHeader}>
                    <Text numberOfLines={1} style={styles.goalTitle}>{goal.topic}</Text>
                    <Text style={styles.goalTime}>{displayFocusDuration(goal.minutes)}</Text>
                  </View>
                  <View style={styles.goalTrack}>
                    <View style={[styles.goalFill, { width: `${100 * goal.minutes / maxGoal}%` as `${number}%` }]} />
                  </View>
                  <Text style={styles.goalSessions}>{goal.sessions} completed sessions</Text>
                </Pressable>
              ))}
          </View>
          <Text style={styles.subtitle}>Verified time and historical estimates are labelled separately. Pending syncs are excluded.</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14, backgroundColor: '#111b27', borderWidth: 1, borderColor: '#293849',
    borderRadius: 22, padding: 18 },
  title: { color: '#f8fafc', fontSize: 24, fontWeight: '900' },
  subtitle: { color: '#91a2b5', fontSize: 12, lineHeight: 18 },
  tabs: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  tab: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 22,
    borderWidth: 1, borderColor: '#334155' },
  tabSelected: { borderColor: '#4ade80', backgroundColor: '#1d4231' },
  tabText: { color: '#a4b3c6', fontSize: 12, fontWeight: '800' },
  tabTextSelected: { color: '#bbf7d0' },
  refresh: { marginLeft: 'auto', paddingHorizontal: 9, paddingVertical: 10 },
  refreshText: { color: '#86efac', fontSize: 12, fontWeight: '700' },
  error: { color: '#fda4af', fontSize: 12 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  metric: { minWidth: '46%', flexGrow: 1, flexBasis: '46%', backgroundColor: '#07141e',
    borderRadius: 14, padding: 13, borderWidth: 1, borderColor: '#254436' },
  metricTitle: { color: '#9cacc0', fontSize: 11, fontWeight: '700' },
  metricValue: { color: '#f8fafc', fontSize: 28, fontWeight: '900', marginTop: 9 },
  metricDetail: { color: '#86efac', fontSize: 11, marginTop: 4 },
  chartCard: { backgroundColor: '#07141e', padding: 15, borderRadius: 15,
    borderWidth: 1, borderColor: '#293849', gap: 13 },
  chartHeading: { color: '#eef4fa', fontSize: 15, fontWeight: '800' },
  chartScroller: { minWidth: '100%' },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, minHeight: 145 },
  barColumn: { justifyContent: 'flex-end', alignItems: 'center' },
  barSpace: { height: 112, justifyContent: 'flex-end', width: '100%' },
  bar: { width: '100%', borderTopLeftRadius: 5, borderTopRightRadius: 5, backgroundColor: '#4ade80' },
  barEmpty: { backgroundColor: '#334155' },
  dayText: { color: '#8495a9', fontSize: 9, paddingTop: 7 },
  goalItem: { gap: 8, paddingTop: 8 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  goalTitle: { color: '#e2e8f0', fontSize: 12, fontWeight: '800', flex: 1 },
  goalTime: { color: '#86efac', fontSize: 12, fontWeight: '800' },
  goalTrack: { backgroundColor: '#273648', borderRadius: 8, height: 7, overflow: 'hidden' },
  goalFill: { backgroundColor: '#4ade80', height: 7, borderRadius: 8 },
  goalSessions: { color: '#7f91a3', fontSize: 11 },
});
