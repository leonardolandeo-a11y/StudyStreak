import { useState } from 'react';
import { Image, View } from 'react-native';
import { useAppearance } from '../../hooks/useAppearance';
import { OwnAvatar } from '../navigation/OwnAvatar';
export function ProfileCover({ banner, avatar, name, integrated = false }: { banner: string | null; avatar: string | null; name: string; integrated?: boolean }) {
  const { theme } = useAppearance();
  const [failedBanner, setFailedBanner] = useState<string | null>(null);
  return <View testID="profile-cover" style={integrated ? {marginHorizontal:-18} : undefined}>
    <View testID="profile-banner" style={[{ backgroundColor: theme.colors.primarySoft, overflow: 'hidden' },integrated ? {aspectRatio:3.2,minHeight:128,maxHeight:220} : {height:128,borderRadius:14}]}>
      {banner && failedBanner !== banner ? <Image source={{ uri: banner }} accessibilityLabel="Profile banner" resizeMode="cover"
        onError={() => setFailedBanner(banner)} style={{ width: '100%', height: '100%' }} /> : null}
    </View>
    <View testID="profile-avatar" style={{ alignSelf: 'flex-start', marginTop: integrated ? -48 : -32, marginLeft: integrated ? 18 : 12, padding: 4, borderRadius: 54, backgroundColor: integrated ? theme.colors.background : theme.colors.surface }}>
      <OwnAvatar uri={avatar} name={name} size={integrated ? 96 : 80} />
    </View>
  </View>;
}
