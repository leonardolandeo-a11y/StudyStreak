import { NavigationPressable } from './NavigationPressable';
import { Text, View, Keyboard } from 'react-native';
import { useEffect, useState, type ComponentProps } from 'react';
import { Tabs } from 'expo-router';
import { useAppearance } from '../../hooks/useAppearance';
import { useCurrentMenuAction } from '../../contexts/MenuActionContext';
import { menuTabs } from '../../features/navigation/menu';

type BarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];
export function MenuTabBar({ state, emitter, navigateToTab, insets }: BarProps) {
  const { theme } = useAppearance();
  const action = useCurrentMenuAction();
  const [keyboard, setKeyboard] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboard(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboard(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  if (keyboard || action?.hidden) return null;
  const tab = (index: number) => {
    const item = menuTabs[index];
    const route = state.routes.find(route => route.name === item.name);
    if (!route) return null;
    const selected = state.routes[state.index].key === route.key;
    return <NavigationPressable key={route.key} accessibilityRole="tab" accessibilityLabel={item.label}
      accessibilityState={{ selected }} onPress={() => {
        const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
        if (!selected && !event.defaultPrevented) navigateToTab(route.key);
      }} onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}
      style={({ pressed }) => ({ flex: 1, minHeight: 56, paddingVertical: 6, alignItems: 'center', justifyContent: 'center',
        backgroundColor: selected || pressed ? theme.colors.primarySoft : theme.colors.surface, borderRadius: 12 })}>
      <Text accessible={false} style={{ color: selected ? theme.colors.primary : theme.colors.muted, fontSize: 21 }}>{item.symbol}</Text>
      <Text style={{ color: selected ? theme.colors.primary : theme.colors.textSecondary, fontSize: 10,
        fontWeight: selected ? '700' : '500', textAlign: 'center' }}>{item.label}</Text>
    </NavigationPressable>;
  };
  return <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface,
    borderTopWidth: 1, borderColor: theme.colors.border, paddingTop: 6, paddingHorizontal: 6, paddingBottom: Math.max(insets.bottom, 8) }}>
    {tab(0)}{tab(1)}
    <NavigationPressable accessibilityRole="button" accessibilityLabel={action?.label ?? 'Contextual action'}
      disabled={!action} onPress={action?.run} style={({ pressed }) => ({ width: 52, height: 52, marginHorizontal: 4,
        borderRadius: 0, backgroundColor: 'transparent',
        alignItems: 'center', justifyContent: 'center', opacity: !action ? .5 : pressed ? .8 : 1 })}>
      <PixelMenuAction/>
    </NavigationPressable>
    {tab(2)}{tab(3)}
  </View>;
}

function PixelMenuAction() {
  const { theme: { colors } } = useAppearance();
  return <View testID="pixel-goal-action" accessible={false} importantForAccessibility="no-hide-descendants" pointerEvents="none" style={{width:48,height:48}}>
    {[[8,0,32,48],[4,4,40,40],[0,8,48,32]].map(([left,top,width,height],index)=><View key={index} style={{position:'absolute',left,top,width,height,backgroundColor:colors.borderStrong}}/>)}
    <View style={{position:'absolute',left:8,top:4,width:32,height:36,backgroundColor:colors.surfaceRaised}}/>
    <View style={{position:'absolute',left:4,top:8,width:40,height:28,backgroundColor:colors.surfaceRaised}}/>
    <View style={{position:'absolute',left:8,top:40,width:32,height:4,backgroundColor:colors.shadow}}/>
    <View style={{position:'absolute',left:20,top:12,width:8,height:24,backgroundColor:colors.primary}}/>
    <View style={{position:'absolute',left:12,top:20,width:24,height:8,backgroundColor:colors.primary}}/>
  </View>;
}
