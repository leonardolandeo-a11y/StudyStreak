import { useEffect, useState, type ReactNode } from 'react';
import { Dimensions, Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppearance } from '../../hooks/useAppearance';
import { StudyBrand } from '../branding/StudyBrand';
import { StudyScene } from './StudyScene';
import { useStudyPeriod } from './useStudyPeriod';
export function AuthScreen({ title, description, children, footer }: { title: string; description: string; children: ReactNode; footer: ReactNode }) {
    const { theme: { colors } } = useAppearance();
    const { width, height } = useWindowDimensions();
    const insets=useSafeAreaInsets();
    const screen=Dimensions.get('screen');
    // Native screen dimensions do not shrink when Android's keyboard resizes the window.
    const landscape=width>=480&&width>height&&(Platform.OS==='web'||screen.width>screen.height);
    const usableWidth=width-insets.left-insets.right;
    const panelWidth=Math.min(Math.max(0,usableWidth-32),landscape?Math.max(248,Math.min(400,Math.floor(usableWidth*.5)-24)):400);
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
        <SafeAreaView style={{ flex: 1 }} edges={['top','right','bottom','left']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
                contentContainerStyle={{ flexGrow: 1, justifyContent: keyboard?'flex-start':'center',alignItems:landscape?'flex-end':'center',padding:16,paddingTop:compact?12:24,paddingBottom:24 }}>
                <View testID="auth-card" style={{width:panelWidth,backgroundColor:colors.surface+'fa',borderColor:colors.borderStrong,borderWidth:2,borderRadius:2,padding:18,gap:16,
                  shadowColor:colors.shadow,shadowOpacity:.2,shadowRadius:0,shadowOffset:{width:3,height:3},elevation:2}}>
                <View testID="auth-pixel-frame" pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" style={{position:'absolute',top:4,right:4,bottom:4,left:4,borderWidth:1,borderColor:colors.primary+'60'}}/>
                {(['top','bottom'] as const).flatMap(vertical=>(['left','right'] as const).map(horizontal=><View key={vertical+horizontal} pointerEvents="none" accessible={false} style={{position:'absolute',[vertical]:8,[horizontal]:8,width:3,height:3,backgroundColor:colors.primary}}/>))}
                <View testID="auth-brand" style={{alignItems:'center'}}><StudyBrand variant="compact"/></View>
                <View style={{gap:6}}><Text accessibilityRole="header" style={{color:colors.text,fontFamily:Platform.OS==='ios'?'Menlo':'monospace',fontSize:compact?22:24,fontWeight:'700'}}>{title}</Text>
                    <Text style={{color:colors.muted,fontSize:13,lineHeight:19}}>{description}</Text></View>
                {children}
                {footer}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    </SafeAreaView>
    </View>;
}
