import { useCallback, useEffect, useState } from 'react';
import { Animated, AppState, Easing, Image, Platform, Text, View } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { totalMemory } from 'expo-device';
import { useStudyPeriod } from '../auth/useStudyPeriod';
import { useAppearance } from '../../hooks/useAppearance';
import { ActionButton } from '../ui/ActionButton';

const pictures = {
    morning: require('../../../assets/environments/academy-pixel-morning.png'),
    afternoon: require('../../../assets/environments/academy-pixel-afternoon.png'),
    night: require('../../../assets/environments/academy-pixel-night.png'),
};
const fallback = require('../../../assets/environments/academy-pixel-static.png');
const panes = [[.445, .572], [.586, .708], [.723, .831]];

/** Same panorama as Web, composed as a full-width scene and compact welcome on narrow screens. */
export function StudyEnvironment({ username }: { username: string }) {
    const { theme, reduceMotion } = useAppearance();
    const period = useStudyPeriod();
    const [width, setWidth] = useState(0);
    const [active, setActive] = useState(false);
    const [failed, setFailed] = useState(false);
    const [constrained, setConstrained] = useState(totalMemory !== null && totalMemory <= 3 * 1024 ** 3);
    const [motion] = useState(() => new Animated.Value(0));
    useFocusEffect(useCallback(() => {
        setActive(AppState.currentState === 'active');
        const state = AppState.addEventListener('change', value => setActive(value === 'active'));
        const memory = AppState.addEventListener('memoryWarning', () => setConstrained(true));
        return () => { setActive(false); state?.remove(); memory?.remove(); };
    }, []));
    const moving = active && !!period && !reduceMotion && !constrained && !failed;
    useEffect(() => {
        if (!moving) { motion.setValue(0); return; }
        const animation = Animated.loop(Animated.sequence([
            Animated.timing(motion, { toValue: 1, duration: 18000, easing: Easing.inOut(Easing.ease), useNativeDriver: true, isInteraction: false }),
            Animated.timing(motion, { toValue: 0, duration: 18000, easing: Easing.inOut(Easing.ease), useNativeDriver: true, isInteraction: false }),
        ]));
        animation.start();
        return () => { animation.stop(); motion.stopAnimation(); motion.setValue(0); };
    }, [moving, motion, period]);
    const height = width / 3;
    const imageStyle = { width, height, ...(Platform.OS === 'web' ? { imageRendering: 'pixelated' as const } : {}) };
    const source = failed ? fallback : period ? pictures[period] : null;
    return <View testID="study-environment" style={{ borderRadius: 12, overflow: 'hidden', backgroundColor: '#392649', borderWidth: 1, borderColor: theme.colors.borderStrong }}>
        <View testID={`study-scene-${period ?? 'pending'}`} onLayout={event => setWidth(event.nativeEvent.layout.width)}
            pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" style={{ width: '100%', aspectRatio: 3, overflow: 'hidden' }}>
            {source && width > 0 ? <>
                <Image testID="panorama-base" source={source} style={imageStyle} resizeMode="stretch" fadeDuration={0} onError={() => setFailed(true)} />
                {!failed ? <View testID={moving ? 'ambient-running' : 'ambient-paused'} style={{ position: 'absolute', width, height }}>
                    {panes.map(([left,right],index) => <View key={index} style={{ position: 'absolute', left: left*width, top: .128*height,
                        width: (right-left)*width, height: .162*height, overflow: 'hidden' }}>
                        <Animated.Image testID={`panorama-clouds-${index}`} source={source} fadeDuration={0}
                            style={[imageStyle, { position: 'absolute', left: -left*width, top: -.128*height,
                                transform: [{ translateX: motion.interpolate({ inputRange: [0,1], outputRange: [0, width*.004] }) }] }]} />
                    </View>)}
                    <Animated.View testID="panorama-steam" style={{ position: 'absolute', left: .713*width, top: .62*height,
                        width: 2, height: height*.06, borderRadius: 2, backgroundColor: '#fff1d6',
                        opacity: motion.interpolate({ inputRange: [0,1], outputRange: [.18,.4] }),
                        transform: [{ translateY: motion.interpolate({ inputRange: [0,1], outputRange: [0,-4] }) }] }} />
                </View> : null}
            </> : null}
        </View>
        <View style={{ padding: 16, gap: 10 }}>
            <Text style={{ color: '#ead5fa', fontSize: 12 }}>{period ? `Good ${period === 'night' ? 'evening' : period}, ${username}` : `Welcome, ${username}`}</Text>
            <Text accessibilityRole="header" style={{ color: '#fff4ff', fontSize: 25, fontWeight: '700', lineHeight: 30 }}>Welcome back to StudyStreak!</Text>
            <Text style={{ color: '#eadff2', fontSize: 13, lineHeight: 19 }}>Keep the momentum going. A few focused sessions today will take you closer to your goals.</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <View style={{ flexGrow: 1 }}><ActionButton compact title="Start focusing" onPress={() => router.navigate('/focus-studio')} /></View>
                <View style={{ flexGrow: 1 }}><ActionButton compact secondary title="Join a Study Room" onPress={() => router.navigate('/study-rooms')} /></View>
            </View>
        </View>
    </View>;
}
