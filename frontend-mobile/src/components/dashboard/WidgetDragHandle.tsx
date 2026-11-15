import { useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { AccessibilityInfo, findNodeHandle, PanResponder, Platform, Pressable, Text, View } from 'react-native';
import { useAppearance } from '../../hooks/useAppearance';
import { widgetLabels, type WidgetId } from '../../features/dashboard/widgetPreferences';

export function WidgetDragHandle({ id, index, count, start, move, finish, choose, accessibleMove, focus, labelPrefix = 'Reorder', compact = false }: {
  labelPrefix?: string; compact?: boolean; focus: boolean; id: WidgetId; index: number; count: number; start(id: WidgetId, pageY: number, pageX?: number): void; move(pageY: number, delta: number, pageX?: number, deltaX?: number): void;
  finish(cancelled: boolean): void; choose(id: WidgetId): void; accessibleMove(id: WidgetId, action: string): void;
}) {
  const { theme: { colors } } = useAppearance();
  const [focused, setFocused] = useState(false);
  const button = useRef<ComponentRef<typeof Pressable>>(null);
  useEffect(() => {
    if (!focus) return;
    const frame = requestAnimationFrame(() => {
      button.current?.focus();
      if (Platform.OS !== 'web') { const node = findNodeHandle(button.current); if (node) AccessibilityInfo.setAccessibilityFocus(node); }
    });
    return () => cancelAnimationFrame(frame);
  }, [focus]);
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponderCapture: (_event, state) => Math.hypot(state.dy,state.dx) >= 8,
    onPanResponderGrant: (event, state) => { start(id, event.nativeEvent.pageY - state.dy, event.nativeEvent.pageX - state.dx); move(state.moveY, state.dy, state.moveX, state.dx); },
    onPanResponderMove: (_event, state) => move(state.moveY, state.dy, state.moveX, state.dx),
    onPanResponderRelease: () => finish(false), onPanResponderTerminate: () => finish(true),
    onPanResponderTerminationRequest: () => false,
  }), [id, start, move, finish]);
  return <View {...responder.panHandlers} style={Platform.OS === 'web' ? { touchAction: 'none' } : undefined}><Pressable ref={button} accessibilityRole="button" accessibilityLabel={`${labelPrefix} ${widgetLabels[id]}`}
    accessibilityHint={`Position ${index+1} of ${count}. Drag, or activate to choose a position.`}
    accessibilityActions={[{ name: 'decrement', label: 'Move up' },{ name: 'increment', label: 'Move down' },{ name: 'first', label: 'Move to first' },{ name: 'last', label: 'Move to last' }]}
    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    onAccessibilityAction={event => accessibleMove(id, event.nativeEvent.actionName)} onPress={() => choose(id)}
    style={({ pressed }) => ({ minWidth: 44, minHeight: compact ? 44 : 48, alignItems: 'center', justifyContent: 'center', borderRadius: 8,
      backgroundColor: pressed ? colors.primarySoft : compact ? 'transparent' : colors.surfaceRaised, borderWidth: 2, borderColor: focused ? colors.focus : 'transparent' })}>
    <Text accessible={false} style={{ color: colors.primary, fontSize: compact ? 22 : 26 }}>⠿</Text>
  </Pressable></View>;
}
