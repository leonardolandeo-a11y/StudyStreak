import { useCallback, useEffect, useState } from 'react';
import { Animated, AppState, Easing, Image, Platform, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { totalMemory } from 'expo-device';
import { useAppearance } from '../../hooks/useAppearance';
import type { SceneId } from '../../features/environment/environmentPreferences';
import { fallback, scenePictures, scenes } from './scenes';

/** Full-width local panorama. Only opacity/transforms use the native animation driver. */
export function EnvironmentScene({ sceneId, enabled, fallbackColor }: { sceneId: SceneId; enabled: boolean; fallbackColor?: string }) {
    const { theme, reduceMotion } = useAppearance();
    const [width, setWidth] = useState(0), [active, setActive] = useState(false), [failed, setFailed] = useState(false);
    const [constrained, setConstrained] = useState(totalMemory !== null && totalMemory <= 3 * 1024 ** 3);
    const [phase] = useState(() => ({ ambient: new Animated.Value(0), steam: new Animated.Value(0) }));
    useFocusEffect(useCallback(() => {
        setActive(AppState.currentState === 'active');
        const state = AppState.addEventListener('change', value => setActive(value === 'active'));
        const memory = AppState.addEventListener('memoryWarning', () => setConstrained(true));
        return () => { setActive(false); state?.remove(); memory?.remove(); };
    }, []));
    const { panes, steam, effect } = scenes[sceneId];
    const moving = enabled && active && width > 0 && !reduceMotion && !constrained && !failed;
    useEffect(() => {
        if (!moving) { Object.values(phase).forEach(value => value.setValue(0)); return; }
        const duration = effect === 'rain' ? 3600 : effect === 'stars' ? 8000 : 21000;
        const ambient = Animated.loop(Animated.sequence([
            Animated.timing(phase.ambient, { toValue: 1, duration, easing: effect === 'rain' ? Easing.linear : Easing.inOut(Easing.ease), useNativeDriver: true, isInteraction: false }),
            Animated.timing(phase.ambient, { toValue: 0, duration: effect === 'rain' ? 0 : duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true, isInteraction: false }),
        ]));
        const vapor = Animated.loop(Animated.sequence([
            Animated.timing(phase.steam, { toValue: 1, duration: 7000, easing: Easing.linear, useNativeDriver: true, isInteraction: false }),
            Animated.timing(phase.steam, { toValue: 0, duration: 0, useNativeDriver: true, isInteraction: false }),
        ]));
        ambient.start(); vapor.start();
        return () => { ambient.stop(); vapor.stop(); Object.values(phase).forEach(value => { value.stopAnimation(); value.setValue(0); }); };
    }, [effect, moving, phase]);
    const height = width / 3;
    const imageStyle = { width, height, ...(Platform.OS === 'web' ? { imageRendering: 'pixelated' as const } : {}) };
    const source = failed ? fallback : scenePictures[sceneId];
    return <View testID={`environment-scene-${sceneId}`}>
        <View onLayout={event => setWidth(event.nativeEvent.layout.width)} pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants"
            style={{ width: '100%', aspectRatio: 3, overflow: 'hidden', backgroundColor: '#513366' }}>
            {width > 0 ? <Image testID="environment-base" source={source} style={imageStyle} resizeMode="stretch" fadeDuration={0} onError={() => setFailed(true)}/> : null}
            <View testID={moving ? 'ambient-running' : 'ambient-paused'} style={{ position: 'absolute', width, height }}>
                {!failed && width > 0 ? <>
                    {effect !== 'stars' && panes.map(([left,right,top,bottom],index) => <View key={index} style={{ position: 'absolute', left: left*width, top: top*height, width: (right-left)*width, height: (bottom-top)*height, overflow: 'hidden' }}>
                        {effect === 'clouds' ? <Animated.Image testID={`environment-clouds-${index}`} source={source} fadeDuration={0}
                            style={[imageStyle, { position: 'absolute', left: -left*width, top: -top*height, transform: [{ translateX: phase.ambient.interpolate({ inputRange: [0,1], outputRange: [0,width*.004] }) }] }]}/>
                            : <Animated.View testID={`environment-rain-${index}`} style={{ position: 'absolute', width: '100%', height: '100%', opacity: .25,
                                transform: [{ translateY: phase.ambient.interpolate({ inputRange: [0,1], outputRange: [-height*.025,height*.055] }) }, { translateX: phase.ambient.interpolate({ inputRange: [0,1], outputRange: [1,-1] }) }] }}>
                                {Array.from({ length: 12 },(_,drop) => <View key={drop} style={{ position: 'absolute', left: `${(drop*7%13)/13*100}%`, top: `${(drop*11%13)/13*100}%`, width: 1, height: Math.max(3,height*.02), backgroundColor: '#dce5ff', transform: [{ rotate: '12deg' }] }}/>) }
                            </Animated.View>}
                    </View>)}
                    {effect === 'stars' ? <Animated.View testID="environment-stars" style={{ position: 'absolute', width, height, opacity: phase.ambient.interpolate({ inputRange: [0,1], outputRange: [.15,.65] }) }}>
                        {[[.49,.20],[.54,.28],[.61,.21],[.76,.24],[.80,.18]].map(([x,y],index) => <View key={index} style={{ position: 'absolute', left: x*width, top: y*height, width: Math.max(1,width/724), height: Math.max(1,width/724), backgroundColor: '#ffe8b8' }}/>) }
                    </Animated.View> : null}
                    <Animated.View testID="environment-steam" style={{ position: 'absolute', left: steam[0]*width, top: (steam[1]-.065)*height, width: 2, height: height*.06, borderRadius: 2, backgroundColor: '#fff1d6',
                        opacity: phase.steam.interpolate({ inputRange: [0,.45,1], outputRange: [.08,.3,0] }), transform: [{ translateY: phase.steam.interpolate({ inputRange: [0,1], outputRange: [0,-4] }) }] }}/>
                </> : null}
            </View>
        </View>
        {failed ? <Text testID="environment-fallback" accessibilityLiveRegion="polite" style={{ color: fallbackColor ?? theme.colors.muted, padding: 6, fontSize: 11 }}>Illustration unavailable · static study nook</Text> : null}
    </View>;
}
