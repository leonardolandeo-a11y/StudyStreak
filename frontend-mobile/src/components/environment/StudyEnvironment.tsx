import { useEffect, useState, type ReactNode } from 'react';
import { Animated, AppState, StyleSheet, Switch, Text, View } from 'react-native';
import { StudyScene } from '../auth/StudyScene';
import { useStudyPeriod } from '../auth/useStudyPeriod';
import { useAppearance } from '../../hooks/useAppearance';

export function StudyEnvironment({ children, enabled = true }: { children?: ReactNode; enabled?: boolean }) {
    const { theme, reduceMotion } = useAppearance();
    const period = useStudyPeriod();
    const [width, setWidth] = useState(0);
    const [fade] = useState(() => new Animated.Value(1));
    useEffect(() => {
        if (!reduceMotion && enabled && AppState.currentState === 'active') {
            fade.setValue(.65);
            Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true, isInteraction: false }).start();
        } else fade.setValue(1);
        const subscription = AppState.addEventListener('change', state => {
            if (state !== 'active') { fade.stopAnimation(); fade.setValue(1); }
        });
        return () => { fade.stopAnimation(); subscription.remove(); };
    }, [period, reduceMotion, enabled, fade]);
    const height = children ? undefined : 162;
    return <View testID="study-environment" onLayout={event => setWidth(event.nativeEvent.layout.width)}
        style={{ position: 'relative', overflow: 'hidden', borderRadius: 12, minWidth: 0, height,
            borderWidth: enabled ? 1 : 0, borderColor: theme.colors.border, backgroundColor: enabled ? theme.colors.surface : 'transparent' }}>
        {enabled && width > 0 ? <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: fade }]}><StudyScene period={period} width={width} height={height ?? 270} /></Animated.View> : null}
        {enabled && children ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.surface, opacity: .25 }]} /> : null}
        {children ? <View style={{ paddingVertical: 16, minHeight: 270, justifyContent: 'center' }}>{children}</View> : null}
        {enabled && !children ? <Text style={{ position: 'absolute', right: 8, bottom: 8, borderRadius: 6, paddingVertical: 4, paddingHorizontal: 8,
            backgroundColor: '#222338e8', color: '#fff3d7', fontSize: 11 }}>Your study nook · {period ?? 'night'}</Text> : null}
    </View>;
}
export function FocusEnvironment({ children }: { children: ReactNode }) {
    const { theme } = useAppearance();
    const [enabled, setEnabled] = useState(true);
    return <View style={{ gap: 4 }}>
        <View style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>Study ambience</Text>
            <Switch accessibilityLabel="Study ambience" value={enabled} onValueChange={setEnabled}
                trackColor={{ false: theme.colors.borderStrong, true: theme.colors.primary }} />
        </View>
        <StudyEnvironment enabled={enabled}>{children}</StudyEnvironment>
    </View>;
}
