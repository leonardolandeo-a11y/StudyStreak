import { useCallback, useEffect, useState } from 'react';
import { Animated, AppState, Easing, Image, Platform, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { totalMemory } from 'expo-device';
import { useAppearance } from '../../hooks/useAppearance';
import scene from './sceneData';
import { sceneImages } from './sceneImages';
import { PixelClouds, cloudTracks } from './PixelClouds';
import type { StudyPeriod } from './studyPeriod';

export function StudyScene({ period, width, height = width * scene.height / scene.width }: { period: StudyPeriod | null; width: number; height?: number }) {
    const { reduceMotion } = useAppearance();
    const [active, setActive] = useState(false);
    const [constrained, setConstrained] = useState(totalMemory !== null && totalMemory <= 3 * 1024 ** 3);
    const [failed, setFailed] = useState(false);
    const [values] = useState(() => ({ clouds: cloudTracks.map(() => new Animated.Value(0)), stars: new Animated.Value(0) }));
    useFocusEffect(useCallback(() => {
        setActive(AppState.currentState === 'active');
        const state = AppState.addEventListener('change', value => setActive(value === 'active'));
        const memory = AppState.addEventListener('memoryWarning', () => setConstrained(true));
        return () => { setActive(false); state?.remove(); memory?.remove(); };
    }, []));
    const moving = active && period !== null && !reduceMotion && !constrained && !failed;
    useEffect(() => {
        const loops = period === 'night' ? [Animated.loop(Animated.sequence([
            Animated.timing(values.stars, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true, isInteraction: false }),
            Animated.timing(values.stars, { toValue: 0, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true, isInteraction: false }),
        ]))] : values.clouds.map((value, index) => Animated.loop(Animated.timing(value, {
            toValue: 1, duration: cloudTracks[index].duration, easing: Easing.linear, useNativeDriver: true, isInteraction: false,
        })));
        if (moving) loops.forEach(loop => loop.start());
        return () => { loops.forEach(loop => loop.stop()); [...values.clouds, values.stars].forEach(value => { value.stopAnimation(); value.setValue(0); }); };
    }, [moving, values, period]);
    const textures = sceneImages[period ?? 'night'];
    const unit = Math.max(width / scene.width, height / scene.height);
    const frame = { position: 'absolute' as const, width: scene.width * unit, height: scene.height * unit,
        left: (width - scene.width * unit) / 2, top: (height - scene.height * unit) / 2 };
    const layer = { width: '100%' as const, height: '100%' as const, ...(Platform.OS === 'web' ? { imageRendering: 'pixelated' as const } : {}) };
    const frameImage = { ...frame, ...(Platform.OS === 'web' ? { imageRendering: 'pixelated' as const } : {}) };
    const [windowX,windowY,windowWidth,windowHeight] = scene.window.clip;
    const windowClip = { position: 'absolute' as const, left: frame.left + windowX*unit, top: frame.top + windowY*unit,
        width: windowWidth*unit, height: windowHeight*unit, overflow: 'hidden' as const };
    const insideWindow = { ...frame, left: -windowX*unit, top: -windowY*unit };
    return <View testID={`study-scene-${period ?? 'pending'}`} pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants"
        style={{ position: 'absolute', top: 0, left: 0, width, height, overflow: 'hidden', backgroundColor: scene.palettes[period ?? 'night'].wall }}>
        <View testID={moving ? "ambient-running" : "ambient-paused"} style={frame}>
            <Image source={failed ? textures.fallback : textures.base} style={layer} resizeMode="stretch" fadeDuration={0} onError={() => setFailed(true)} />
        </View>
        {!failed ? <>
            <View style={windowClip} testID="scene-window">
                <View testID="scene-landscape" style={insideWindow}><Image source={textures.landscape} style={layer} fadeDuration={0} /></View>
                {period !== 'night' ? <View testID="scene-clouds" style={{ position: 'absolute', left: 0, top: 0, width: windowWidth*unit, height: 55*unit, overflow: 'hidden' }}>
                    <View style={insideWindow}><PixelClouds values={values.clouds} unit={unit} color={scene.palettes[period ?? 'morning'].page}/></View>
                </View> : <Animated.View testID="scene-stars" style={[insideWindow, { opacity: values.stars.interpolate({ inputRange: [0,1], outputRange: [.55,.9] }) }]}><Image source={textures.stars} style={layer} fadeDuration={0} /></Animated.View>}

            </View>
            <Image testID="scene-window-frame" source={textures.windowFrame} style={frameImage} fadeDuration={0} />
            <View testID="scene-steam" style={[frame, { opacity: .4 }]}><Image source={textures.steam} style={layer} fadeDuration={0} /></View>
            <View style={[frame, { opacity: .08 }]}><Image source={textures.glow} style={layer} fadeDuration={0} /></View>
        </> : null}
    </View>;
}
