import { useState } from 'react';
import { Animated, ScrollView, Switch, Text, View } from 'react-native';
import { useAppearance } from '../../hooks/useAppearance';
import { useWidgetDrag } from '../../hooks/useWidgetDrag';
import { NavigationPressable } from '../navigation/NavigationPressable';
import { AppIcon } from '../ui/AppIcon';
import { WidgetDragHandle } from './WidgetDragHandle';
import { widgetLabels, type WidgetId, type WidgetSetting } from '../../features/dashboard/widgetPreferences';
type Props = { selectedId: WidgetId | null; onSelect(id: WidgetId): void; rows: WidgetSetting[]; save(rows: WidgetSetting[]): Promise<void>; announce(message: string): void; };
export function WidgetReorderList({ rows, save, announce, onSelect, selectedId }: Props) {
  const { theme: { colors } } = useAppearance();
  const { drag, translation, scrollRef, viewportRef, registerRow, scrollProps, start, move, finish, accessibleMove } = useWidgetDrag({ rows, save, announce, onSelect });
  const [expanded, setExpanded] = useState<Partial<Record<WidgetId, boolean>>>({});
  const dragFrom = drag ? rows.findIndex(row => row.id === drag.id) : -1;
  return <View ref={viewportRef} collapsable={false} style={{ flex: 1, minHeight: 0 }}>
    <ScrollView ref={scrollRef} {...scrollProps} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 10, maxWidth: 760, width: '100%', alignSelf: 'center' }}>
      {rows.map((row,index) => <Animated.View key={row.id} testID={`customize-row-${row.id}`}
        onLayout={event => { registerRow(row.id, event.nativeEvent.layout); }}
        style={{ gap: 4, opacity: drag?.id === row.id ? .75 : 1, zIndex: drag?.id === row.id ? 2 : 0,
          transform: [{ translateY: drag?.id === row.id ? translation : 0 }] }}>
        <View testID={drag?.target === index && dragFrom >= index ? 'widget-drop-target' : undefined} style={{ height: 3, backgroundColor: drag?.target === index && dragFrom >= index ? colors.primary : 'transparent' }}/>
        <View style={{ padding: 10, borderRadius: 10, borderWidth: 1,
          borderColor: drag?.id === row.id || selectedId === row.id ? colors.primary : colors.border, backgroundColor: selectedId === row.id ? colors.primarySoft : colors.surface }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Switch accessibilityLabel={`Show ${widgetLabels[row.id]}`} value={row.visible}
            onValueChange={visible => { void save(rows.map(item => item.id === row.id ? { ...item, visible } : item)); announce(`${widgetLabels[row.id]} ${visible ? 'shown' : 'hidden'}.`); }}
            trackColor={{ false: colors.borderStrong, true: colors.primary }}/>
          <Text style={{ flex: 1, color: colors.text, fontSize: 14 }}>{widgetLabels[row.id]}</Text>
          <WidgetDragHandle selected={selectedId === row.id} id={row.id} index={index} count={rows.length} start={start} move={move} finish={finish} onSelect={onSelect} accessibleMove={accessibleMove}/>
          <NavigationPressable accessibilityRole="button" accessibilityLabel={`About ${widgetLabels[row.id]}`}
            accessibilityState={{ expanded: !!expanded[row.id] }} aria-expanded={!!expanded[row.id]} aria-controls={`widget-description-${row.id}`}
            onPress={() => setExpanded(current => ({ ...current, [row.id]: !current[row.id] }))}
            style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
            <AppIcon name={expanded[row.id] ? 'chevron-down' : 'chevron-up'} color={colors.muted} size={16}/>
          </NavigationPressable>
          </View>
          {expanded[row.id] ? <Text nativeID={`widget-description-${row.id}`} testID={`widget-description-${row.id}`} style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19, paddingTop: 8 }}>{widgetDescriptions[row.id]}</Text> : null}
        </View>
        {drag?.target === index && dragFrom < index ? <View testID="widget-drop-target" style={{ position: 'absolute', left: 0, right: 0, bottom: -6, height: 3, backgroundColor: colors.primary }}/> : null}
      </Animated.View>)}
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
