import { useEffect, useState, type ReactNode } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppearance } from '../../hooks/useAppearance';
import { StudyBrand } from '../branding/StudyBrand';
import { StudyScene } from './StudyScene';
import { useStudyPeriod } from './useStudyPeriod';
export function AuthScreen({ title, description, children, footer }: { title: string; description: string; children: ReactNode; footer: ReactNode }) {
    const { theme: { colors } } = useAppearance();
    const { width, height } = useWindowDimensions();
    const [keyboard, setKeyboard] = useState(false);
    const period = useStudyPeriod();
    useEffect(() => {
        const show = Keyboard.addListener('keyboardDidShow', () => setKeyboard(true));
        const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboard(false));
        return () => { show.remove(); hide.remove(); };
    }, []);
    const compact = keyboard || height < 600;
    return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top','bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
                contentContainerStyle={{ flexGrow: 1, width: '100%', maxWidth: 520, alignSelf: 'center', padding: 16, gap: 18 }}>
                {!compact ? <View testID="auth-art" style={{ alignItems: 'center', gap: 12 }}>
                    <StudyBrand variant="signature" />
                    <StudyScene period={period} width={Math.min(width - 32, 360)} />
                </View> : null}
                <View style={{ gap: 8 }}><Text accessibilityRole="header" style={{ color: colors.text, fontSize: 26, fontWeight: '700' }}>{title}</Text>
                    <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21 }}>{description}</Text></View>
                {children}
                {footer}
            </ScrollView>
        </KeyboardAvoidingView>
    </SafeAreaView>;
}
