import { useState } from 'react';
import { Image, Text, View } from 'react-native';
import { useAppearance } from '../../hooks/useAppearance';

export function OwnAvatar({ uri, name, size = 48 }: { uri: string | null; name: string; size?: number }) {
  const { theme } = useAppearance();
  const [failed, setFailed] = useState<string | null>(null);
  if (uri && failed !== uri) return <Image source={{ uri }} accessibilityLabel={`${name}'s avatar`}
    style={{ width: size, height: size, borderRadius: size / 2 }} onError={() => setFailed(uri)} />;
  return <View accessibilityLabel={`${name}'s avatar, initials`} accessible style={{ width: size, height: size,
    borderRadius: size / 2, backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ color: theme.colors.primary, fontWeight: '700', fontSize: size / 3 }}>{name.trim().slice(0, 1).toUpperCase() || '?'}</Text>
  </View>;
}
