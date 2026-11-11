import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Animated, AppState, Platform, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { totalMemory } from 'expo-device';
import { useAppearance } from '../../hooks/useAppearance';
import { PixelRule, StudyMark } from '../branding/StudyBrand';
import glyphs from './glyphs';
export type AcademicGlyph = Exclude<keyof typeof glyphs, 'grid'>;
export function PixelGlyph({ name = 'book', size = 28 }: { name?: AcademicGlyph; size?: number }) {
    const { theme: { colors } } = useAppearance();
    const fills = { ink: colors.text, accent: colors.primary, paper: colors.surface, muted: colors.muted };
    const unit = size / glyphs.grid;
    return <View testID={`pixel-glyph-${name}`} accessible={false} importantForAccessibility="no-hide-descendants" style={{ width: size, height: size, flexShrink: 0 }}>
        {glyphs[name].map(([x,y,width,height,role],index) => <View key={index} accessible={false} style={{ position: 'absolute', left: x*unit, top: y*unit, width: width*unit, height: height*unit, backgroundColor: fills[role] }} />)}
    </View>;
}
export function AcademicHeading({ title, eyebrow, description, focus = false, glyph = 'book' }: { title: string; eyebrow: string; description?: string; focus?: boolean; glyph?: AcademicGlyph }) {
    const { theme: { colors } } = useAppearance();
    return <View style={{ gap: 8, paddingVertical: 6, paddingBottom: 14, borderBottomWidth: 1, borderColor: colors.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            {focus ? <StudyMark size={28} decorative /> : <PixelGlyph name={glyph} />}
            <Text style={{ color: colors.primary, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 11, letterSpacing: 1, flexShrink: 1 }}>{eyebrow}</Text><PixelRule />
        </View>
        <Text accessibilityRole="header" style={{ color: colors.text, fontSize: 26, fontWeight: '700', letterSpacing: -.5 }}>{title}</Text>
        {description ? <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>{description}</Text> : null}
    </View>;
}
export function AcademicPanel({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
    const { theme: { colors } } = useAppearance();
    return <View testID="academic-panel" style={[{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
        borderRadius: 8, padding: 14, gap: 12, shadowColor: colors.border, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0 },style]}>{children}</View>;
}
export function AcademicEmpty({ children, glyph = 'book' }: { children: ReactNode; glyph?: AcademicGlyph }) {
    return <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 8 }}><PixelGlyph name={glyph} size={32} /><View style={{ flex: 1 }}>{children}</View></View>;
}
export function PixelProgress({ value, max = 100, label }: { value: number; max?: number; label: string }) {
    const { theme: { colors }, reduceMotion } = useAppearance();
    const percent = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
    const [fill] = useState(() => new Animated.Value(percent));
    const [active, setActive] = useState(false);
    const [constrained, setConstrained] = useState(totalMemory !== null && totalMemory <= 3 * 1024 ** 3);
    useFocusEffect(useCallback(() => {
        setActive(AppState.currentState === 'active');
        const subscription = AppState.addEventListener('change', state => setActive(state === 'active'));
        const memory = AppState.addEventListener('memoryWarning', () => setConstrained(true));
        return () => { setActive(false); subscription?.remove(); memory?.remove(); };
    }, []));
    useEffect(() => {
        if (reduceMotion || !active || constrained) fill.setValue(percent);
        else Animated.timing(fill, { toValue: percent, duration: 250, useNativeDriver: true, isInteraction: false }).start();
        return () => fill.stopAnimation();
    }, [fill, percent, reduceMotion, active, constrained]);
    return <View accessible accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 0, max, now: value }}
        aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}
        style={{ height: 6, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
        <Animated.View style={{ height: '100%', width: '100%', transformOrigin: 'left', transform: [{ scaleX: fill }], backgroundColor: colors.primary }} />
        <View accessible={false} pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, flexDirection: 'row' }}>
            {Array.from({ length: 10 },(_,index) => <View key={index} style={{ flex: 1, borderRightWidth: index === 9 ? 0 : 2, borderColor: colors.surface }} />)}
        </View>
    </View>;
}
