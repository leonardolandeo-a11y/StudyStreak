import { useState } from 'react';
import { Text, View } from 'react-native';
import { useAppearance } from '../../hooks/useAppearance';
import { workspacePalette } from '../academic/workspacePalette';
import { NavigationPressable } from '../navigation/NavigationPressable';
import type { DailyFocus } from '../../features/focus/focusStatisticsService';
import { activityColor, calendarPadding } from '../study/chartPresentation';
export function RecordedCalendar({ activity }: { activity: DailyFocus[] }) {
  const { theme } = useAppearance(); const colors = workspacePalette(theme);
  const months = [...new Set(activity.map(item => item.date.slice(0,7)))];
  const [chosen, setChosen] = useState(months.at(-1));
  const [selected, setSelected] = useState<string | null>(null);
  const month = chosen && months.includes(chosen) ? chosen : months.at(-1);
  const index = months.indexOf(month ?? '');
  const days = activity.filter(item => item.date.startsWith(month ?? '!'));
  const day = activity.find(item => item.date === selected);
  const caption = { color: colors.muted, fontSize: 12 };
  return <View testID="recorded-activity-calendar" style={{ gap: 12, padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.surface }}>
    <Text accessibilityRole="header" style={{ color: colors.text, fontSize: 18, fontWeight: '600' }}>A year of showing up</Text>
    <Text style={caption}>{activity[0]?.date} – {activity.at(-1)?.date} · recorded time, including historical estimates.</Text>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <NavigationPressable accessibilityRole="button" accessibilityLabel="Previous activity month" disabled={index <= 0}
        onPress={() => { setChosen(months[index-1]); setSelected(null); }} style={{ minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center', opacity: index <= 0 ? .4 : 1 }}><Text style={{ color: colors.primary }}>←</Text></NavigationPressable>
      <Text style={{ flex: 1, textAlign: 'center', color: colors.text, fontWeight: '600' }}>{month ? new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(month+'-15T12:00:00Z')) : 'No activity'}</Text>
      <NavigationPressable accessibilityRole="button" accessibilityLabel="Next activity month" disabled={index < 0 || index >= months.length-1}
        onPress={() => { setChosen(months[index+1]); setSelected(null); }} style={{ minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center', opacity: index >= months.length-1 ? .4 : 1 }}><Text style={{ color: colors.primary }}>→</Text></NavigationPressable>
    </View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {['M','T','W','T','F','S','S'].map((value,i) => <Text key={'label'+i} style={{ width: '14.285714%', textAlign: 'center', ...caption }}>{value}</Text>)}
      {Array.from({ length: calendarPadding(days[0]?.date) },(_,i) => <View key={'pad'+i} style={{ width: '14.285714%', minHeight: 44 }}/>) }
      {days.map(item => <NavigationPressable key={item.date} accessibilityRole="button"
        accessibilityLabel={`${item.date}: ${item.minutes} minutes, ${item.sessions} sessions`} accessibilityState={{ selected: selected === item.date }}
        onPress={() => setSelected(item.date)} style={{ width: '14.285714%', minHeight: 44, padding: 2 }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: activityColor(item.minutes, colors),
          borderWidth: selected === item.date ? 2 : 1, borderColor: selected === item.date ? colors.primary : colors.border, borderRadius: 5 }}>
          <Text style={{ color: item.minutes >= 30 ? colors.primaryText : colors.text, fontSize: 12 }}>{Number(item.date.slice(-2))}</Text>
        </View>
      </NavigationPressable>)}
    </View>
    <Text accessibilityLiveRegion="polite" style={caption}>{day ? `${day.date} · ${day.minutes} min · ${day.sessions} sessions` : 'Tap a date for its recorded value.'}</Text>
    <Text style={caption}>Intensity: 0 · 1–29 · 30–59 · 60+ min</Text>
  </View>;
}
