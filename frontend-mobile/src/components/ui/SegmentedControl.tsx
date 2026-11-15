import type { ThemeColors } from '../../features/appearance/theme';
import { Text, View } from 'react-native';
import { NavigationPressable } from '../navigation/NavigationPressable';
import { useAppearance } from '../../hooks/useAppearance';

export function SegmentedControl<T extends string | number>({ options, value, onChange, colors: override }: {
  options: readonly { value: T; label: string }[]; value: T; onChange(value: T): void; colors?: ThemeColors;
}) {
  const { theme } = useAppearance();
  const colors = override ?? theme.colors;
  return <View style={{ flexDirection: 'row', alignSelf: 'flex-start', borderRadius: 12, padding: 2, backgroundColor: colors.surfaceRaised }}>
    {options.map(option => <NavigationPressable key={option.value} accessibilityRole="button" accessibilityLabel={option.label}
      accessibilityState={{ selected: value === option.value }} onPress={() => onChange(option.value)}
      style={{ minHeight: 44, minWidth: 76, paddingHorizontal: 10, justifyContent: 'center', alignItems: 'center',
        borderRadius: 10, backgroundColor: value === option.value ? colors.primarySoft : 'transparent' }}>
      <Text style={{ color: value === option.value ? colors.primary : colors.muted, fontSize: 13, fontWeight: '600' }}>{option.label}</Text>
    </NavigationPressable>)}
  </View>;
}
