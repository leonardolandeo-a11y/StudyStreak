import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { AccessibilityInfo, Animated, findNodeHandle, PanResponder, Platform, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useAppearance } from '../../hooks/useAppearance';
import { widgetLabels, type WidgetId, type WidgetSetting } from '../../features/dashboard/widgetPreferences';
import { moveWidgetTo, widgetDropIndex, type RowFrame } from '../../features/dashboard/widgetReorder';

type Props = { focusId?: WidgetId | null; rows: WidgetSetting[]; save(rows: WidgetSetting[]): Promise<void>; announce(message: string): void; choose(id: WidgetId): void };
export function WidgetReorderList({ rows, save, announce, choose, focusId }: Props) {
  const { theme: { colors } } = useAppearance();
  const [drag, setDrag] = useState<{ id: WidgetId; target: number } | null>(null);
  const [translation] = useState(() => new Animated.Value(0));
  const latest = useRef({ rows, save, announce, choose }); latest.current = { rows, save, announce, choose };
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null), viewport = useRef<ComponentRef<typeof View>>(null);
  const frames = useRef(new Map<WidgetId, RowFrame>());
  const position = useRef({ top: 0, height: 0, offset: 0, content: 0 });
  const gesture = useRef<{ id: WidgetId; target: number; pageY: number; delta: number; originOffset: number; active: boolean } | null>(null);
  const animation = useRef<number | null>(null);
  const stop = useCallback(() => { if (animation.current !== null) cancelAnimationFrame(animation.current); animation.current = null; }, []);
  useEffect(() => () => { stop(); gesture.current = null; translation.stopAnimation(); }, [stop, translation]);
  const update = useCallback(() => {
    const current = gesture.current; if (!current?.active) return;
    const ordered = latest.current.rows.map(row => frames.current.get(row.id));
    if (ordered.some(frame => !frame)) return;
    const target = widgetDropIndex(current.pageY - position.current.top + position.current.offset, ordered as RowFrame[]);
    translation.setValue(current.delta + position.current.offset - current.originOffset);
    if (target !== current.target) { current.target = target; setDrag({ id: current.id, target }); }
  }, [translation]);
  const autoScroll = useCallback(function tick() {
    const current = gesture.current; if (!current?.active) return;
    const { top, height, offset, content } = position.current;
    const direction = current.pageY < top + 48 ? -1 : current.pageY > top + height - 48 ? 1 : 0;
    const next = Math.max(0, Math.min(Math.max(0, content-height), offset+direction*6));
    if (next !== offset) { position.current.offset = next; scroll.current?.scrollTo({ y: next, animated: false }); update(); }
    animation.current = requestAnimationFrame(tick);
  }, [update]);
  const start = useCallback((id: WidgetId, pageY: number) => {
    stop();
    viewport.current?.measureInWindow((_x, top, _width, height) => { position.current.top = top; position.current.height = height; });
    gesture.current = { id, pageY, target: latest.current.rows.findIndex(row => row.id === id), delta: 0, originOffset: position.current.offset, active: false };
  }, [stop]);
  const move = useCallback((pageY: number, delta: number) => {
    const current = gesture.current; if (!current) return;
    current.pageY = pageY; current.delta = delta;
    if (!current.active && Math.abs(delta) >= 8) {
      current.active = true; setDrag({ id: current.id, target: current.target });
      latest.current.announce(`Moving ${widgetLabels[current.id]}. Release to place; Back cancels.`);
      animation.current = requestAnimationFrame(autoScroll);
    }
    update();
  }, [autoScroll, update]);
  const finish = useCallback((cancelled: boolean) => {
    stop(); const current = gesture.current; gesture.current = null; setDrag(null); translation.setValue(0);
    if (!current) return;
    if (cancelled) { latest.current.announce('Reordering cancelled.'); return; }
    if (!current.active) { latest.current.choose(current.id); return; }
    const next = moveWidgetTo(latest.current.rows, current.id, current.target);
    if (next !== latest.current.rows) void latest.current.save(next);
    latest.current.announce(`${widgetLabels[current.id]} at position ${current.target+1} of ${next.length}.`);
  }, [stop, translation]);
  const accessibleMove = useCallback((id: WidgetId, action: string) => {
    if (!['increment','decrement','first','last'].includes(action)) { if (action === 'activate') latest.current.choose(id); return; }
    const index = latest.current.rows.findIndex(row => row.id === id);
    const target = action === 'increment' ? index+1 : action === 'decrement' ? index-1 : action === 'first' ? 0 : latest.current.rows.length-1;
    const next = moveWidgetTo(latest.current.rows, id, target);
    if (next !== latest.current.rows) void latest.current.save(next);
    latest.current.announce(`${widgetLabels[id]} at position ${next.findIndex(row=>row.id===id)+1} of ${next.length}.`);
  }, []);
  const dragFrom = drag ? rows.findIndex(row => row.id === drag.id) : -1;
  return <View ref={viewport} collapsable={false} style={{ flex: 1, minHeight: 0 }} onLayout={event => { position.current.height = event.nativeEvent.layout.height; }}>
    <ScrollView ref={scroll} scrollEnabled={!drag} scrollEventThrottle={16} keyboardShouldPersistTaps="handled"
      onScroll={event => { position.current.offset = event.nativeEvent.contentOffset.y; }}
      onContentSizeChange={(_width,height) => { position.current.content = height; }} contentContainerStyle={{ padding: 16, gap: 10, maxWidth: 760, width: '100%', alignSelf: 'center' }}>
      {rows.map((row,index) => <Animated.View key={row.id} testID={`customize-row-${row.id}`}
        onLayout={event => { frames.current.set(row.id, event.nativeEvent.layout); }}
        style={{ gap: 4, opacity: drag?.id === row.id ? .75 : 1, zIndex: drag?.id === row.id ? 2 : 0,
          transform: [{ translateY: drag?.id === row.id ? translation : 0 }] }}>
        <View testID={drag?.target === index && dragFrom >= index ? 'widget-drop-target' : undefined} style={{ height: 3, backgroundColor: drag?.target === index && dragFrom >= index ? colors.primary : 'transparent' }}/>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, borderWidth: 1,
          borderColor: drag?.id === row.id ? colors.primary : colors.border, backgroundColor: colors.surface }}>
          <Switch accessibilityLabel={`Show ${widgetLabels[row.id]}`} value={row.visible}
            onValueChange={visible => { void save(rows.map(item => item.id === row.id ? { ...item, visible } : item)); announce(`${widgetLabels[row.id]} ${visible ? 'shown' : 'hidden'}.`); }}
            trackColor={{ false: colors.borderStrong, true: colors.primary }}/>
          <Text style={{ flex: 1, color: colors.text, fontSize: 14 }}>{widgetLabels[row.id]}</Text>
          <DragHandle focus={focusId === row.id} id={row.id} index={index} count={rows.length} start={start} move={move} finish={finish} choose={choose} accessibleMove={accessibleMove}/>
        </View>
        {drag?.target === index && dragFrom < index ? <View testID="widget-drop-target" style={{ position: 'absolute', left: 0, right: 0, bottom: -6, height: 3, backgroundColor: colors.primary }}/> : null}
      </Animated.View>)}
    </ScrollView>
  </View>;
}
function DragHandle({ id, index, count, start, move, finish, choose, accessibleMove, focus }: {
  focus: boolean; id: WidgetId; index: number; count: number; start(id: WidgetId, pageY: number): void; move(pageY: number, delta: number): void;
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
    onMoveShouldSetPanResponderCapture: (_event, state) => Math.abs(state.dy) >= 8,
    onPanResponderGrant: (event, state) => { start(id, event.nativeEvent.pageY - state.dy); move(state.moveY, state.dy); },
    onPanResponderMove: (_event, state) => move(state.moveY, state.dy),
    onPanResponderRelease: () => finish(false), onPanResponderTerminate: () => finish(true),
    onPanResponderTerminationRequest: () => false,
  }), [id, start, move, finish]);
  return <View {...responder.panHandlers} style={Platform.OS === 'web' ? { touchAction: 'none' } : undefined}><Pressable ref={button} accessibilityRole="button" accessibilityLabel={`Reorder ${widgetLabels[id]}`}
    accessibilityHint={`Position ${index+1} of ${count}. Drag, or activate to choose a position.`}
    accessibilityActions={[{ name: 'decrement', label: 'Move up' },{ name: 'increment', label: 'Move down' },{ name: 'first', label: 'Move to first' },{ name: 'last', label: 'Move to last' }]}
    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    onAccessibilityAction={event => accessibleMove(id, event.nativeEvent.actionName)} onPress={() => choose(id)}
    style={({ pressed }) => ({ minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 8,
      backgroundColor: pressed ? colors.primarySoft : colors.surfaceRaised, borderWidth: 2, borderColor: focused ? colors.focus : 'transparent' })}>
    <Text accessible={false} style={{ color: colors.primary, fontSize: 26 }}>⠿</Text>
  </Pressable></View>;
}
