import { useCallback, useRef, useState, type ComponentRef } from 'react';
import { AccessibilityInfo, findNodeHandle, Modal, Platform, ScrollView, Text, View } from 'react-native';
import { useIsFocused } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppearance } from '../../hooks/useAppearance';
import { ActionButton } from '../ui/ActionButton';
import { NavigationPressable } from '../navigation/NavigationPressable';
import { AppIcon } from '../ui/AppIcon';
import { WidgetReorderList } from './WidgetReorderList';
import { moveWidgetTo } from '../../features/dashboard/widgetReorder';
import { defaultWidgets, widgetLabels, type WidgetId, type WidgetSetting } from '../../features/dashboard/widgetPreferences';

export function CustomizeDashboard({ rows, ready, error, save }: { rows: WidgetSetting[]; ready: boolean; error: string | null; save(rows: WidgetSetting[]): Promise<void> }) {
  const { theme: { colors }, reduceMotion } = useAppearance();
  const focused = useIsFocused();
  const [open, setOpen] = useState(false), [announcement, setAnnouncement] = useState('');
  const [choosing, setChoosing] = useState<WidgetId | null>(null);
  const [focusId, setFocusId] = useState<WidgetId | null>(null);
  const trigger = useRef<ComponentRef<typeof NavigationPressable>>(null);
  const heading = useRef<ComponentRef<typeof Text>>(null);
  const restoreFocus = useCallback(() => {
    trigger.current?.focus();
    if (Platform.OS !== 'web') {
      const node = findNodeHandle(trigger.current); if (node) AccessibilityInfo.setAccessibilityFocus(node);
    }
  }, []);
  const close = () => { setOpen(false); setChoosing(null); requestAnimationFrame(restoreFocus); };
  const choose = useCallback((id: WidgetId) => { setFocusId(id); setChoosing(id); }, []);
  const announce = useCallback((message: string) => {
    setAnnouncement(message);
    if (Platform.OS !== 'web') AccessibilityInfo.announceForAccessibility(message);
  }, []);
  return <>
    <View style={{ alignSelf: 'flex-end' }}>
      <NavigationPressable ref={trigger} accessibilityRole="button" accessibilityLabel="Customize Dashboard" accessibilityState={{ disabled: !ready, expanded: open }}
        aria-expanded={open} disabled={!ready} onPress={() => { setOpen(true); setChoosing(null); setFocusId(null); }}
        style={{ padding: 12, minHeight: 48, borderRadius: 8, backgroundColor: colors.surfaceRaised }}>
        <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>Customize Dashboard</Text>
      </NavigationPressable>
    </View>
    {error ? <View><Text accessibilityRole="alert" style={{ color: colors.error }}>{error}</Text><ActionButton compact secondary title="Retry layout" onPress={() => { void save(rows); }}/></View> : null}
    <Modal visible={open && focused} animationType={reduceMotion ? 'none' : 'slide'} presentationStyle="fullScreen" onRequestClose={close} onDismiss={restoreFocus}
      onShow={() => { if (Platform.OS === 'web') heading.current?.focus(); else { const node = findNodeHandle(heading.current); if (node) AccessibilityInfo.setAccessibilityFocus(node); } }}>
      {open && focused ? <SafeAreaView testID="dashboard-customization-modal" accessibilityViewIsModal onAccessibilityEscape={close}
        style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 8, backgroundColor: colors.surface }}>
          <Text ref={heading} tabIndex={-1} accessibilityRole="header" style={{ flex: 1, color: colors.text, fontSize: 20, fontWeight: '700' }}>Customize Dashboard</Text>
          <NavigationPressable accessibilityRole="button" accessibilityLabel="Close customization" onPress={close} style={{ minWidth: 48, minHeight: 56, alignItems: 'center', justifyContent: 'center' }}>
            <AppIcon name="close" color={colors.text}/>
          </NavigationPressable>
        </View>
        <Text style={{ padding: 16, color: colors.muted, fontSize: 13, lineHeight: 19 }}>Drag a handle to reorder. Tap a handle to choose a position. Changes save on this device for your account.</Text>
        {choosing ? <ScrollView contentContainerStyle={{ padding: 16, gap: 10, maxWidth: 760, width: '100%', alignSelf: 'center' }}>
          <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={{ color: colors.text, fontSize: 18 }}>Place {widgetLabels[choosing]}</Text>
          {rows.map((row,index) => <ActionButton key={row.id} secondary compact title={`Position ${index+1} · ${widgetLabels[row.id]}`}
            onPress={() => { const next = moveWidgetTo(rows, choosing, index); if (next !== rows) void save(next); announce(`${widgetLabels[choosing]} at position ${index+1} of ${rows.length}.`); setChoosing(null); }}/>) }
          <ActionButton secondary title="Cancel position change" onPress={() => setChoosing(null)}/>
        </ScrollView> : <WidgetReorderList focusId={focusId} rows={rows} save={save} announce={announce} choose={choose}/>}
        <View style={{ padding: 16, gap: 10, borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}>
          <Text accessibilityLiveRegion="polite" style={{ color: colors.muted, fontSize: 12 }}>{announcement}</Text>
          {error ? <Text accessibilityRole="alert" style={{ color: colors.error }}>{error}</Text> : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <ActionButton secondary compact title="Restore default layout" onPress={() => { void save(defaultWidgets()); setChoosing(null); announce('Default layout restored.'); }}/>
            <ActionButton compact title="Done customizing" onPress={close}/>
          </View>
        </View>
      </SafeAreaView> : null}
    </Modal>
  </>;
}
