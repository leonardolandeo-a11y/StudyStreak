import { Redirect, useLocalSearchParams } from 'expo-router';
import { useSocialMember } from '../../../../contexts/SocialContext';
import { useAuth } from '../../../../hooks/useAuth';
import { MemberProfileContent } from '../../../../components/social/MemberProfileContent';
import { Screen } from '../../../../components/ui/Screen';
import { StatusMessage } from '../../../../components/ui/StatusMessage';
function Member({ id }: { id: number }) {
  const { member, directory } = useSocialMember(id, 'profile');
  return <MemberProfileContent member={member} onRefresh={() => { void directory?.loadMember(id, true); }} />;
}

export default function MemberProfile() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { currentUser } = useAuth(); const id = Number(userId);
  if (!/^\d+$/.test(userId ?? '') || !Number.isSafeInteger(id) || id <= 0) return <Screen themed compact><StatusMessage error message="Invalid profile address." /></Screen>;
  if (id === currentUser?.id) return <Redirect href="/(app)/profile" />;
  return <Member key={id} id={id} />;
}
