import { useMemo, useState } from 'react';
import { PanResponder, Platform, Pressable, Text, View } from 'react-native';
import { useAppearance } from '../../hooks/useAppearance';
import { widgetLabels, type WidgetId } from '../../features/dashboard/widgetPreferences';

export function WidgetDragHandle({ id, index, count, start, move, finish, onSelect, accessibleMove, selected = false, labelPrefix = 'Reorder', compact = false }: {
  labelPrefix?: string; compact?: boolean; selected?: boolean; id: WidgetId; index: number; count: number; start(id: WidgetId, pageY: number, pageX?: number): void; move(pageY: number, delta: number, pageX?: number, deltaX?: number): void;
  finish(cancelled: boolean): void; onSelect(id: WidgetId): void; accessibleMove(id: WidgetId, action: string): void;
}) {
  const { theme: { colors } } = useAppearance();
  const [focused, setFocused] = useState(false);
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponderCapture: (_event, state) => Math.hypot(state.dy,state.dx) >= 8,
    onPanResponderGrant: (event, state) => { start(id, event.nativeEvent.pageY - state.dy, event.nativeEvent.pageX - state.dx); move(state.moveY, state.dy, state.moveX, state.dx); },
    onPanResponderMove: (_event, state) => move(state.moveY, state.dy, state.moveX, state.dx),
    onPanResponderRelease: () => finish(false), onPanResponderTerminate: () => finish(true),
    onPanResponderTerminationRequest: () => false,
  }), [id, start, move, finish]);
  return <View {...responder.panHandlers} style={Platform.OS === 'web' ? { touchAction: 'none' } : undefined}><Pressable accessibilityRole="button" accessibilityLabel={`${labelPrefix} ${widgetLabels[id]}`}
    accessibilityState={{ selected }} aria-pressed={selected}
    accessibilityHint={`Position ${index+1} of ${count}. Tap to select or deselect. Drag to reorder; accessibility actions also move the widget.`}
    accessibilityActions={[{ name: 'decrement', label: 'Move up' },{ name: 'increment', label: 'Move down' },{ name: 'first', label: 'Move to first' },{ name: 'last', label: 'Move to last' }]}
    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    onAccessibilityAction={event => accessibleMove(id, event.nativeEvent.actionName)} onPress={() => onSelect(id)}
    style={({ pressed }) => ({ minWidth: 44, minHeight: compact ? 44 : 48, alignItems: 'center', justifyContent: 'center', borderRadius: 8,
      backgroundColor: pressed || selected ? colors.primarySoft : compact ? 'transparent' : colors.surfaceRaised, borderWidth: 2, borderColor: focused || selected ? colors.focus : 'transparent' })}>
    <Text accessible={false} style={{ color: colors.primary, fontSize: compact ? 22 : 26 }}>⠿</Text>
  </Pressable></View>;
}
