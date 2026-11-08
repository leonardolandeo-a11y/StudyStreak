import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useAppearance } from '../../hooks/useAppearance';

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { theme } = useAppearance();
  return <View style={[{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border,
    borderWidth: 1, borderRadius: theme.radius.panel, padding: 20, gap: 16 }, style]}>{children}</View>;
}
