import { useState } from 'react';
import { ScrollView, Switch, Text, View } from 'react-native';
import { useAppearance } from '../../hooks/useAppearance';
import { NavigationPressable } from '../navigation/NavigationPressable';
import { AppIcon } from '../ui/AppIcon';
import { widgetLabels, type WidgetId, type WidgetSetting } from '../../features/dashboard/widgetPreferences';
type Props = { selectedId: WidgetId | null; rows: WidgetSetting[]; save(rows: WidgetSetting[]): Promise<void>; announce(message: string): void };
export function WidgetReorderList({ rows, save, announce, selectedId }: Props) {
  const { theme: { colors } } = useAppearance();
  const [expanded, setExpanded] = useState<Partial<Record<WidgetId, boolean>>>({});
  return <View style={{ flex: 1, minHeight: 0 }}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 8, maxWidth: 760, width: '100%', alignSelf: 'center' }}>
      {rows.map(row => <View key={row.id} testID={`customize-row-${row.id}`} style={{ padding: 10, borderRadius: 10, borderWidth: 1,
        borderColor: selectedId === row.id ? colors.primary : colors.border, backgroundColor: selectedId === row.id ? colors.primarySoft : colors.surface }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Switch accessibilityLabel={`Show ${widgetLabels[row.id]}`} value={row.visible}
            onValueChange={visible => { void save(rows.map(item => item.id === row.id ? { ...item, visible } : item)); announce(`${widgetLabels[row.id]} ${visible ? 'shown' : 'hidden'}.`); }}
            trackColor={{ false: colors.borderStrong, true: colors.primary }}/>
          <Text style={{ flex: 1, color: colors.text, fontSize: 14 }}>{widgetLabels[row.id]}</Text>
          <NavigationPressable accessibilityRole="button" accessibilityLabel={`About ${widgetLabels[row.id]}`}
            accessibilityState={{ expanded: !!expanded[row.id] }} aria-expanded={!!expanded[row.id]} aria-controls={`widget-description-${row.id}`}
            onPress={() => setExpanded(current => ({ ...current, [row.id]: !current[row.id] }))}
            style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
            <AppIcon name={expanded[row.id] ? 'chevron-down' : 'chevron-up'} color={colors.muted} size={16}/>
          </NavigationPressable>
        </View>
        {expanded[row.id] ? <Text nativeID={`widget-description-${row.id}`} testID={`widget-description-${row.id}`} style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19, paddingTop: 8 }}>{widgetDescriptions[row.id]}</Text> : null}
      </View>)}
    </ScrollView>
  </View>;
}
const widgetDescriptions: Record<WidgetId, string> = {
  activity: 'Daily verified study minutes for 7 or 30 days, shown as bars or a line.',
  'focus-summary': 'Verified focus minutes, completed sessions and daily average for the selected period.',
  streak: 'Your current study streak from completed study days, including historical records.',
  goals: 'Up to three active goals with session targets and links to their study records and progress.',
  journey: 'Recorded totals and study details, including historical estimates, trends and session history.',
  recent: 'Recent study attempts in the selected period, with their saved minutes and status.',
  partners: 'Accepted study partners and links to their profiles.',
  quick: 'A shortcut to Focus Studio.',
  calendar: 'Daily recorded minutes and sessions, including historical estimates.',
};
