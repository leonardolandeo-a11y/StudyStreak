import { useContext } from 'react';
import { NavigationDataContext } from '../../contexts/NavigationDataContext';
import { router } from 'expo-router';
import { Text } from 'react-native';
import { useSocialMember } from '../../contexts/SocialContext';
import { useAuth } from '../../hooks/useAuth';
import { useAppearance } from '../../hooks/useAppearance';
import { OwnAvatar } from '../navigation/OwnAvatar';
import { NavigationPressable } from '../navigation/NavigationPressable';
export function SocialAvatar({ userId, name, size = 40 }: { userId: number; name: string; size?: number }) {
  const { avatar } = useSocialMember(userId);
  const own = useContext(NavigationDataContext);
  const { currentUser } = useAuth();
  return <OwnAvatar uri={userId === currentUser?.id ? own?.avatar ?? null : avatar} name={name} size={size} />;
}
export function MemberProfileLink({ userId, name }: { userId: number; name: string }) {
  const { accepted } = useSocialMember(userId);
  const { currentUser } = useAuth();
  const { theme } = useAppearance();
  if (userId !== currentUser?.id && !accepted) return null;
  return <NavigationPressable accessibilityRole="button" accessibilityLabel={`View profile of ${name}`}
    onPress={() => userId === currentUser?.id ? router.push('/(app)/profile')
      : router.push({ pathname: '/(app)/users/[userId]/profile', params: { userId: String(userId) } })}
    style={{ alignSelf: 'flex-start', minHeight: 48, justifyContent: 'center', paddingHorizontal: 4, borderRadius: 6 }}>
    <Text style={{ color: theme.colors.primary, fontSize: 13, fontWeight: '600' }}>View profile</Text>
  </NavigationPressable>;
}
