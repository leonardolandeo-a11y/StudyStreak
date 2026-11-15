import { useEffect, useState } from 'react';
import { Animated, AppState, Easing, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppearance } from '../../hooks/useAppearance';
import { StudyMark } from '../branding/StudyBrand';
// Native steam spiral; no external images or SVG runtime.
const spiral = Array.from({ length: 48 }, (_, index) => {
  const angle = Math.PI + index / 47 * Math.PI * 3;
  const radius = 17 - index / 47 * 14;
  return { left: 24 + Math.cos(angle) * radius, top: 23 + Math.sin(angle) * radius };
});
export function AppLoadingScreen({ message = 'Loading your study space...' }: { message?: string }) {
  const { theme: { colors }, reduceMotion, ready } = useAppearance();
  const [active, setActive] = useState(AppState.currentState === 'active');
  const [rotation] = useState(() => new Animated.Value(0));
  const moving = ready && active && !reduceMotion;
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => setActive(state === 'active'));
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(rotation, { toValue: 1, duration: 3600, easing: Easing.linear, useNativeDriver: true, isInteraction: false }));
    if (moving) loop.start();
    return () => { loop.stop(); rotation.stopAnimation(); rotation.setValue(0); };
  }, [moving, rotation]);
  return <SafeAreaView testID="app-loading-screen" accessible accessibilityRole="progressbar" accessibilityLiveRegion="polite" accessibilityLabel={message}
    style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 14, backgroundColor: colors.background }}>
    <View accessible={false} importantForAccessibility="no-hide-descendants" style={{ width: 88, height: 104 }}>
      <View style={{ position: 'absolute', left: 8, bottom: 0, width: 72, height: 52, overflow: 'hidden' }}>
        <View style={{ top: -20 }}><StudyMark size={72} decorative /></View>
      </View>
      <View style={{ position: 'absolute', left: 20, top: 0, width: 48, height: 56 }}>
        <Animated.View testID={moving ? 'loading-steam-running' : 'loading-steam-paused'} style={{ width: 48, height: 46,
          transform: [{ rotate: rotation.interpolate({ inputRange: [0,1], outputRange: ['0deg','360deg'] }) }] }}>
          {spiral.map((point, index) => <View key={index} style={{ position: 'absolute', ...point, width: 2.5, height: 2.5,
            borderRadius: 2, backgroundColor: colors.primary, opacity: .7 }}/>) }
        </Animated.View>
        <View style={{ position: 'absolute', left: 22, top: 43, width: 3, height: 10, borderRadius: 2, backgroundColor: colors.primary, opacity: .6 }}/>
      </View>
    </View>
    <Text style={{ maxWidth: 260, color: colors.textSecondary, fontSize: 14, lineHeight: 21, textAlign: 'center' }}>{message}</Text>
  </SafeAreaView>;
}
