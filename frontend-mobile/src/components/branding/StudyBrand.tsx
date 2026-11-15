import { Platform, Text, View } from 'react-native';
import { useAppearance } from '../../hooks/useAppearance';
import mark from './mark';

export function StudyMark({ size = 36, decorative = false }: { size?: number; decorative?: boolean }) {
  const { theme: { colors } } = useAppearance();
  const fills: Record<string, string> = { ink: colors.text, accent: colors.primary, paper: colors.primaryText, muted: colors.muted, warm: colors.pending };
  const unit = size / mark.grid;
  return <View testID="study-mark" accessible={!decorative} accessibilityRole="image"
    accessibilityLabel={decorative ? undefined : 'StudyStreak coffee mark'}
    importantForAccessibility={decorative ? 'no-hide-descendants' : 'auto'} style={{ width: size, height: size, flexShrink: 0 }}>
    {mark.rects.filter(rect => size > 24 || rect[5] !== 'detail').map(([x,y,width,height,role], index) =>
      <View key={index} accessible={false} style={{ position: 'absolute', left: Number(x)*unit, top: Number(y)*unit,
        width: Number(width)*unit, height: Number(height)*unit, backgroundColor: fills[String(role)] }} />)}
  </View>;
}
export function PixelRule() {
  const { theme: { colors } } = useAppearance();
  return <View accessible={false} importantForAccessibility="no-hide-descendants" style={{ width: 28, height: 6 }}>
    <View style={{ position: 'absolute', width: 24, height: 2, backgroundColor: colors.primary }} />
    <View style={{ position: 'absolute', left: 4, top: 4, width: 24, height: 2, backgroundColor: colors.border }} />
  </View>;
}
export function StudyBrand({ variant = 'navigation' }: { variant?: 'navigation' | 'compact' | 'signature' }) {
  const { theme: { colors } } = useAppearance();
  const signature = variant === 'signature';
  const fontFamily = Platform.OS === 'ios' ? 'Menlo' : 'monospace';
  return <View testID="study-brand" accessible accessibilityLabel="StudyStreak" accessibilityHint={variant === 'compact' ? undefined : 'Small sessions. Lasting progress.'}
    style={{ flexDirection: signature ? 'column' : 'row', alignItems: 'center', gap: signature ? 12 : 10, minWidth: 0 }}>
    <StudyMark size={signature ? 64 : variant === 'compact' ? 32 : 52} decorative />
    <View style={{ flexShrink: 1, minWidth: 0, gap: 3, alignItems: signature ? 'center' : 'flex-start' }}>
      <Text numberOfLines={1} style={{ color: colors.text, fontFamily, fontWeight: '700', fontSize: signature ? 24 : 16, letterSpacing: -.5 }}>Study<Text style={{ color: colors.primary }}>Streak</Text></Text>
      {variant !== 'compact' ? <Text style={{ color: colors.muted, fontSize: signature ? 12 : 11, lineHeight: signature ? 18 : 16 }}>Small sessions. Lasting progress.</Text> : null}
    </View>
    {signature ? <PixelRule /> : null}
  </View>;
}
