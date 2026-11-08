import { Text, View } from 'react-native';
import { useAppearance } from '../../hooks/useAppearance';

export function PageHeading({ title, description, eyebrow }: { title: string; description?: string; eyebrow?: string }) {
  const { theme } = useAppearance();
  return <View style={{ gap: 10, paddingVertical: 8 }}>
    {eyebrow ? <Text style={{ color: theme.colors.primary, fontSize: 12, letterSpacing: 2, fontWeight: '700' }}>{eyebrow}</Text> : null}
    <Text accessibilityRole="header" style={{ color: theme.colors.text, fontSize: theme.typography.heading,
      fontWeight: '800' }}>{title}</Text>
    {description ? <Text style={{ color: theme.colors.muted, fontSize: theme.typography.body, lineHeight: 24 }}>{description}</Text> : null}
  </View>;
}
