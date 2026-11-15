import { Animated, ScrollView, Switch, Text, View } from 'react-native';
import { useAppearance } from '../../hooks/useAppearance';
import { useWidgetDrag } from '../../hooks/useWidgetDrag';
import { WidgetDragHandle } from './WidgetDragHandle';
import { widgetLabels, type WidgetId, type WidgetSetting } from '../../features/dashboard/widgetPreferences';
type Props = { focusId?: WidgetId | null; rows: WidgetSetting[]; save(rows: WidgetSetting[]): Promise<void>; announce(message: string): void; choose(id: WidgetId): void };
export function WidgetReorderList({ rows, save, announce, choose, focusId }: Props) {
  const { theme: { colors } } = useAppearance();
  const { drag, translation, scrollRef, viewportRef, registerRow, scrollProps, start, move, finish, accessibleMove } = useWidgetDrag({ rows, save, announce, choose });
  const dragFrom = drag ? rows.findIndex(row => row.id === drag.id) : -1;
  return <View ref={viewportRef} collapsable={false} style={{ flex: 1, minHeight: 0 }}>
    <ScrollView ref={scrollRef} {...scrollProps} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 10, maxWidth: 760, width: '100%', alignSelf: 'center' }}>
      {rows.map((row,index) => <Animated.View key={row.id} testID={`customize-row-${row.id}`}
        onLayout={event => { registerRow(row.id, event.nativeEvent.layout); }}
        style={{ gap: 4, opacity: drag?.id === row.id ? .75 : 1, zIndex: drag?.id === row.id ? 2 : 0,
          transform: [{ translateY: drag?.id === row.id ? translation : 0 }] }}>
        <View testID={drag?.target === index && dragFrom >= index ? 'widget-drop-target' : undefined} style={{ height: 3, backgroundColor: drag?.target === index && dragFrom >= index ? colors.primary : 'transparent' }}/>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, borderWidth: 1,
          borderColor: drag?.id === row.id ? colors.primary : colors.border, backgroundColor: colors.surface }}>
          <Switch accessibilityLabel={`Show ${widgetLabels[row.id]}`} value={row.visible}
            onValueChange={visible => { void save(rows.map(item => item.id === row.id ? { ...item, visible } : item)); announce(`${widgetLabels[row.id]} ${visible ? 'shown' : 'hidden'}.`); }}
            trackColor={{ false: colors.borderStrong, true: colors.primary }}/>
          <Text style={{ flex: 1, color: colors.text, fontSize: 14 }}>{widgetLabels[row.id]}</Text>
          <WidgetDragHandle focus={focusId === row.id} id={row.id} index={index} count={rows.length} start={start} move={move} finish={finish} choose={choose} accessibleMove={accessibleMove}/>
        </View>
        {drag?.target === index && dragFrom < index ? <View testID="widget-drop-target" style={{ position: 'absolute', left: 0, right: 0, bottom: -6, height: 3, backgroundColor: colors.primary }}/> : null}
      </Animated.View>)}
    </ScrollView>
  </View>;
}