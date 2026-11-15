import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import { Animated, AppState, BackHandler, ScrollView, View, type LayoutChangeEvent, type LayoutRectangle, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { widgetLabels, type WidgetId, type WidgetSetting } from '../features/dashboard/widgetPreferences';
import { moveVisibleWidgetTo, widgetDropIndex, type RowFrame } from '../features/dashboard/widgetReorder';

/** Shared by the modal and Dashboard; only handles start a drag, only drop saves. */
export function useWidgetDrag({ rows, items = rows, save, announce, onSelect, enabled = true }: {
  rows: WidgetSetting[]; items?: WidgetSetting[]; save(rows: WidgetSetting[]): Promise<void>;
  announce(message: string): void; onSelect(id: WidgetId): void; enabled?: boolean;
}) {
  const [drag, setDrag] = useState<{ id: WidgetId; target: number; from: number; frame?: RowFrame } | null>(null);
  const [translation] = useState(() => new Animated.Value(0));
  const [translationX] = useState(() => new Animated.Value(0));
  const contentRef = useRef<ComponentRef<typeof View>>(null);
  const latest = useRef({ rows, items, save, announce, onSelect }); latest.current = { rows, items, save, announce, onSelect };
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null), viewport = useRef<ComponentRef<typeof View>>(null);
  const frames = useRef(new Map<WidgetId, RowFrame>());
  const position = useRef({ top: 0, left: 0, originY: 0, originX: 0, height: 0, offset: 0, content: 0 });
  const gesture = useRef<{ id: WidgetId; target: number; pageX: number; pageY: number; deltaX: number; delta: number; originOffset: number; active: boolean } | null>(null);
  const animation = useRef<number | null>(null);
  const stop = useCallback(() => { if (animation.current !== null) cancelAnimationFrame(animation.current); animation.current = null; }, []);
  useEffect(() => () => { stop(); gesture.current = null; translation.stopAnimation(); translationX.stopAnimation(); }, [stop, translation, translationX]);
  const preview = useCallback((id: WidgetId, target: number) => ({ id, target,
    from: latest.current.items.findIndex(row => row.id === id), frame: frames.current.get(latest.current.items[target]?.id) }), []);
  const update = useCallback(() => {
    const current = gesture.current; if (!current?.active) return;
    const ordered = latest.current.items.map(row => frames.current.get(row.id));
    if (ordered.some(frame => !frame)) return;
    const target = widgetDropIndex(current.pageY - position.current.top + position.current.offset - position.current.originY, ordered as RowFrame[], current.pageX - position.current.left - position.current.originX);
    translationX.setValue(current.deltaX);
    translation.setValue(current.delta + position.current.offset - current.originOffset);
    if (target !== current.target) { current.target = target; setDrag(preview(current.id, target)); }
  }, [translation, translationX, preview]);
  const autoScroll = useCallback(function tick() {
    const current = gesture.current; if (!current?.active) return;
    const { top, height, offset, content } = position.current;
    const direction = current.pageY < top + 48 ? -1 : current.pageY > top + height - 48 ? 1 : 0;
    const next = Math.max(0, Math.min(Math.max(0, content-height), offset+direction*6));
    if (next !== offset) { position.current.offset = next; scroll.current?.scrollTo({ y: next, animated: false }); update(); }
    animation.current = requestAnimationFrame(tick);
  }, [update]);
  const start = useCallback((id: WidgetId, pageY: number, pageX = 0) => {
    if (!enabled) return;
    stop();
    viewport.current?.measureInWindow((left, top, _width, height) => {
      position.current.top = top; position.current.left = left; position.current.height = height;
      contentRef.current?.measureInWindow((x,y) => {
        position.current.originY = y - top + position.current.offset;
        position.current.originX = x - left; update();
      });
    });
    gesture.current = { id, pageX, pageY, deltaX: 0, target: latest.current.items.findIndex(row => row.id === id), delta: 0, originOffset: position.current.offset, active: false };
  }, [stop, update, enabled]);
  const move = useCallback((pageY: number, delta: number, pageX = 0, deltaX = 0) => {
    const current = gesture.current; if (!current) return;
    current.pageY = pageY; current.delta = delta; current.pageX = pageX; current.deltaX = deltaX;
    if (!current.active && Math.hypot(delta,deltaX) >= 8) {
      current.active = true; setDrag(preview(current.id, current.target));
      latest.current.announce(`Moving ${widgetLabels[current.id]}. Release to place; Back cancels.`);
      animation.current = requestAnimationFrame(autoScroll);
    }
    update();
  }, [autoScroll, update, preview]);
  const finish = useCallback((cancelled: boolean) => {
    stop(); const current = gesture.current; gesture.current = null; setDrag(null); translation.setValue(0); translationX.setValue(0);
    if (!current) return;
    if (cancelled) { latest.current.announce('Reordering cancelled.'); return; }
    if (!current.active) { latest.current.onSelect(current.id); return; }
    const next = moveVisibleWidgetTo(latest.current.rows, current.id, latest.current.items[current.target]?.id);
    if (next !== latest.current.rows) void latest.current.save(next);
    latest.current.announce(`${widgetLabels[current.id]} at position ${current.target+1} of ${latest.current.items.length}.`);
  }, [stop, translation, translationX]);
  const accessibleMove = useCallback((id: WidgetId, action: string) => {
    if (!['increment','decrement','first','last'].includes(action)) { if (action === 'activate') latest.current.onSelect(id); return; }
    const index = latest.current.items.findIndex(row => row.id === id);
    const target = action === 'increment' ? index+1 : action === 'decrement' ? index-1 : action === 'first' ? 0 : latest.current.items.length-1;
    const next = moveVisibleWidgetTo(latest.current.rows, id, latest.current.items[Math.max(0, Math.min(latest.current.items.length-1,target))]?.id);
    if (next !== latest.current.rows) void latest.current.save(next);
    latest.current.announce(`${widgetLabels[id]} at position ${target < 0 ? 1 : Math.min(target+1,latest.current.items.length)} of ${latest.current.items.length}.`);
  }, []);
  useEffect(() => { if (!enabled) finish(true); }, [enabled, finish]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => { if (state !== 'active') finish(true); });
    return () => subscription.remove();
  }, [finish]);
  useEffect(() => {
    if (!drag) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { finish(true); return true; });
    return () => subscription.remove();
  }, [drag, finish]);
  const registerRow = useCallback((id: WidgetId, frame: LayoutRectangle) => { frames.current.set(id, frame); }, []);
  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => { position.current.offset = event.nativeEvent.contentOffset.y; }, []);
  const onContentSizeChange = useCallback((_width: number, height: number) => { position.current.content = height; }, []);
  const onLayout = useCallback((event: LayoutChangeEvent) => { position.current.height = event.nativeEvent.layout.height; }, []);
  const onContentLayout = useCallback((event: LayoutChangeEvent) => { position.current.originY = event.nativeEvent.layout.y; position.current.originX = event.nativeEvent.layout.x; }, []);
  return { drag, translation, translationX, scrollRef: scroll, viewportRef: viewport, contentRef, registerRow, onContentLayout,
    scrollProps: { scrollEnabled: !drag, scrollEventThrottle: 16, onScroll, onContentSizeChange, onLayout }, start, move, finish, accessibleMove };
}
