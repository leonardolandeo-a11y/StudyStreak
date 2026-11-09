import { useCallback, useEffect, useState } from 'react';
import { Animated, AppState, Easing, Image, Platform, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { totalMemory } from 'expo-device';
import { useAppearance } from '../../hooks/useAppearance';
import scene from './sceneData';
import { sceneImages } from './sceneImages';
import type { StudyPeriod } from './studyPeriod';

export function StudyScene({ period, width, height = width * scene.height / scene.width }: { period: StudyPeriod | null; width: number; height?: number }) {
    const { reduceMotion } = useAppearance();
    const [active, setActive] = useState(false);
    const [constrained, setConstrained] = useState(totalMemory !== null && totalMemory <= 3 * 1024 ** 3);
    const [failed, setFailed] = useState(false);
    const [values] = useState(() => ({ clouds: new Animated.Value(0), steam: new Animated.Value(0), stars: new Animated.Value(0), glow: new Animated.Value(0) }));
    useFocusEffect(useCallback(() => {
        setActive(AppState.currentState === 'active');
        const state = AppState.addEventListener('change', value => setActive(value === 'active'));
        const memory = AppState.addEventListener('memoryWarning', () => setConstrained(true));
        return () => { setActive(false); state?.remove(); memory?.remove(); };
    }, []));
    const moving = active && !reduceMotion && !constrained && !failed;
    useEffect(() => {
        const loops = Object.entries(values).map(([name,value]) => {
            const duration = { clouds: 26000, steam: 4500, stars: 8000, glow: 9000 }[name] ?? 8000;
            return Animated.loop(Animated.sequence([
                Animated.timing(value, { toValue: 1, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true, isInteraction: false }),
                Animated.timing(value, { toValue: 0, duration: name === 'steam' ? 0 : duration, useNativeDriver: true, isInteraction: false }),
            ]));
        });
        if (moving) loops.forEach(loop => loop.start());
        return () => { loops.forEach(loop => loop.stop()); Object.values(values).forEach(value => { value.stopAnimation(); value.setValue(0); }); };
    }, [moving, values]);
    const textures = sceneImages[period ?? 'night'];
    const unit = Math.max(width / scene.width, height / scene.height);
    const frame = { position: 'absolute' as const, width: scene.width * unit, height: scene.height * unit,
        left: (width - scene.width * unit) / 2, top: (height - scene.height * unit) / 2 };
    const layer = { width: '100%' as const, height: '100%' as const, ...(Platform.OS === 'web' ? { imageRendering: 'pixelated' as const } : {}) };
    return <View testID={`study-scene-${period ?? 'pending'}`} pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants"
        style={{ position: 'absolute', top: 0, left: 0, width, height, overflow: 'hidden', backgroundColor: scene.palettes[period ?? 'night'].wall }}>
        <Animated.View testID={moving ? "ambient-running" : "ambient-paused"} style={[frame, { transform: [{ scale: 1.02 }, { translateX: values.clouds.interpolate({ inputRange: [0,1], outputRange: [-unit,unit] }) }] }]}><Image source={failed ? textures.fallback : textures.base} style={layer} resizeMode="stretch" fadeDuration={0} onError={() => setFailed(true)} /></Animated.View>
        {!failed ? <>
            <Animated.View testID="scene-clouds" style={[frame, { opacity: .65, transform: [{ translateX: values.clouds.interpolate({ inputRange: [0,1], outputRange: [-3*unit,5*unit] }) }] }]}><Image source={textures.clouds} style={layer} fadeDuration={0} /></Animated.View>
            <Animated.View testID="scene-steam" style={[frame, { opacity: moving ? values.steam.interpolate({ inputRange: [0,.35,1], outputRange: [0,.55,0] }) : .4, transform: [{ translateY: values.steam.interpolate({ inputRange: [0,1], outputRange: [0,-7*unit] }) }] }]}><Image source={textures.steam} style={layer} fadeDuration={0} /></Animated.View>
            <Animated.View style={[frame, { opacity: values.stars.interpolate({ inputRange: [0,.5,1], outputRange: [.5,1,.5] }) }]}><Image source={textures.stars} style={layer} fadeDuration={0} /></Animated.View>
            <Animated.View style={[frame, { opacity: values.glow.interpolate({ inputRange: [0,1], outputRange: [.06,.16] }) }]}><Image source={textures.glow} style={layer} fadeDuration={0} /></Animated.View>
        </> : null}
    </View>;
}
