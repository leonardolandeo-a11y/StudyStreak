import { useEffect, useRef, useState } from 'react';
import { Animated, View, type ViewStyle } from 'react-native';
import { useAppearance } from '../../hooks/useAppearance';

export type IconName = 'menu' | 'dashboard' | 'focus' | 'resources' | 'notifications' | 'settings' | 'device' | 'bars' | 'lines' | 'back' | 'close';
export function AppIcon({ name, color, size = 22, pulse = 0 }: { name: IconName; color: string; size?: number; pulse?: number }) {
  const { reduceMotion } = useAppearance();
  const [motion] = useState(() => new Animated.Value(0));
  const lastPulse = useRef(pulse);
  useEffect(() => {
    if (reduceMotion) { lastPulse.current = pulse; motion.stopAnimation(); motion.setValue(0); return; }
    if (lastPulse.current === pulse) return;
    lastPulse.current = pulse;
    const animation = Animated.sequence([
      Animated.timing(motion, { toValue: 1, duration: 140, useNativeDriver: true }),
      Animated.timing(motion, { toValue: 0, duration: 160, useNativeDriver: true }),
    ]);
    animation.start();
    return () => { animation.stop(); motion.setValue(0); };
  }, [pulse, reduceMotion, motion]);
  const tilt = motion.interpolate({ inputRange: [0, .35, .7, 1], outputRange: ['0deg', '-10deg', '8deg', '0deg'] });
  const line = (left: number, top: number, width: number, rotate = 0): ViewStyle => ({ position: 'absolute', left, top, width, height: 2,
    borderRadius: 1, backgroundColor: color, transform: [{ rotate: `${rotate}deg` }] });
  const box = (left: number, top: number, width: number, height: number, radius = 2): ViewStyle => ({ position: 'absolute', left, top,
    width, height, borderRadius: radius, borderWidth: 1.8, borderColor: color });
  return <View accessible={false} importantForAccessibility="no-hide-descendants" style={{ width: size, height: size }}>
    <Animated.View testID={`icon-${name}-motion`} style={{ width: 24, height: 24, left: (size - 24) / 2, top: (size - 24) / 2,
      transform: [{ scale: size / 24 }, { rotate: name === 'focus' || name === 'notifications' ? tilt : '0deg' }] }}>
      {name === 'menu' || name === 'dashboard' ? [[2, 2], [14, 2], [2, 14], [14, 14]].map(([x, y], index) =>
        <Animated.View key={index} style={[box(x, y, 8, 8), { transform: [
          { translateX: motion.interpolate({ inputRange: [0, 1], outputRange: [0, x < 10 ? -1.5 : 1.5] }) },
          { translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [0, y < 10 ? -1.5 : 1.5] }) },
        ] }]} />) : null}
      {name === 'focus' ? <><View style={[box(3, 2, 18, 17, 10), { borderBottomWidth: 0 }]} />
        <View style={box(1, 12, 6, 10, 3)} /><View style={box(17, 12, 6, 10, 3)} /></> : null}
      {name === 'resources' ? <><View style={box(1, 4, 11, 17)} /><View style={box(12, 4, 11, 17)} />
        <Animated.View testID="icon-page" style={{ position: 'absolute', left: 12, top: 5, width: 9, height: 14, borderWidth: 1.5,
          borderColor: color, borderRadius: 1, transformOrigin: 'left center', transform: [
            { perspective: 80 }, { rotateY: motion.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-135deg'] }) },
          ] }} /></> : null}
      {name === 'notifications' ? <><View style={[box(5, 3, 14, 16, 8), { borderBottomLeftRadius: 3, borderBottomRightRadius: 3 }]} />
        <View style={line(2, 19, 20)} /><View style={{ ...line(10, 22, 4), height: 2 }} /></> : null}
      {name === 'device' ? <><View style={box(5, 1, 14, 22, 3)} /><View style={line(10, 19, 4)} /></> : null}
      {name === 'settings' ? <><View style={box(5, 5, 14, 14, 7)} /><View style={box(9, 9, 6, 6, 3)} />
        {[0, 45, 90, 135].map(angle => <View key={angle} style={{ position: 'absolute', width: 24, height: 24, transform: [{ rotate: `${angle}deg` }] }}>
          <View style={line(10, 1, 4, 90)} /><View style={line(10, 21, 4, 90)} /></View>)}</> : null}
      {name === 'bars' ? [10, 18, 14].map((height, index) => <View key={index} style={box(2 + index * 8, 22 - height, 5, height, 1)} />) : null}
      {name === 'lines' ? <><View style={line(1, 14, 10, -40)} /><View style={line(8, 12, 9, 30)} /><View style={line(14, 8, 11, -55)} /></> : null}
      {name === 'back' ? <><View style={line(3, 11, 18)} /><View style={line(1, 7, 10, -45)} /><View style={line(1, 15, 10, 45)} /></> : null}
      {name === 'close' ? <><View style={line(2, 11, 20, 45)} /><View style={line(2, 11, 20, -45)} /></> : null}
    </Animated.View>
  </View>;
}
