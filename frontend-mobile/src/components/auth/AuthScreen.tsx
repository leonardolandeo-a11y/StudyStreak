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
    return <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StudyScene period={period} width={width} height={height} />
        <SafeAreaView style={{ flex: 1 }} edges={['top','bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 16, paddingTop: compact ? 16 : 64, paddingBottom: 24 }}>
                <View testID="auth-card" style={{ width: '100%', maxWidth: 440, alignSelf: 'center', backgroundColor: colors.surface + 'f0', borderColor: colors.border, borderWidth: 1, borderRadius: 18, padding: 20, gap: 18, shadowColor: colors.shadow, shadowOpacity: .16, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 3 }}>
                <View testID="auth-brand" style={{ alignItems: 'center' }}><StudyBrand variant={compact ? 'compact' : 'signature'} /></View>
                <View style={{ gap: 8 }}><Text accessibilityRole="header" style={{ color: colors.text, fontSize: 26, fontWeight: '700' }}>{title}</Text>
                    <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21 }}>{description}</Text></View>
                {children}
                {footer}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    </SafeAreaView>
    </View>;
}
