import { useState } from 'react';
import { Image, View } from 'react-native';
import { useAppearance } from '../../hooks/useAppearance';
import { OwnAvatar } from '../navigation/OwnAvatar';
export function ProfileCover({ banner, avatar, name }: { banner: string | null; avatar: string | null; name: string }) {
  const { theme } = useAppearance();
  const [failedBanner, setFailedBanner] = useState<string | null>(null);
  return <View>
    <View style={{ height: 128, backgroundColor: theme.colors.primarySoft, borderRadius: 14, overflow: 'hidden' }}>
      {banner && failedBanner !== banner ? <Image source={{ uri: banner }} accessibilityLabel="Profile banner" resizeMode="cover"
        onError={() => setFailedBanner(banner)} style={{ width: '100%', height: '100%' }} /> : null}
    </View>
    <View style={{ alignSelf: 'flex-start', marginTop: -32, marginLeft: 12, padding: 4, borderRadius: 50, backgroundColor: theme.colors.surface }}>
      <OwnAvatar uri={avatar} name={name} size={80} />
    </View>
  </View>;
}
