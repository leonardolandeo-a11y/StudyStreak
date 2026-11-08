import { Text } from 'react-native';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAppearance } from '../../hooks/useAppearance';
import { useNavigationData } from '../../contexts/NavigationDataContext';
import { Screen } from '../../components/ui/Screen';
import { PageHeading } from '../../components/ui/PageHeading';
import { Card } from '../../components/ui/Card';
import { StatusMessage } from '../../components/ui/StatusMessage';
import { ActionButton } from '../../components/ui/ActionButton';
import { OwnAvatar } from '../../components/navigation/OwnAvatar';

export default function Profile() {
  const { currentUser, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState(false);
  const { theme } = useAppearance();
  const { profile, avatar, loading, error, retry } = useNavigationData();
  const name = profile?.presentationName || currentUser?.username || 'StudyStreak';
  return <Screen themed>
    <PageHeading title="My profile" />
    {loading ? <StatusMessage message="Loading your profile…" /> : null}
    {error ? <><StatusMessage error message={error} /><ActionButton title="Retry profile" onPress={retry} /></> : null}
    {profile ? <Card><OwnAvatar uri={avatar} name={name} size={80} />
      <Text accessibilityRole="header" style={{ color: theme.colors.text, fontSize: 24, fontWeight: '700' }}>{name}</Text>
      <Text style={{ color: theme.colors.muted }}>@{profile.username}</Text>
      {profile.bio ? <Text style={{ color: theme.colors.text, lineHeight: 24 }}>{profile.bio}</Text> : null}
    </Card> : null}
    {signOutError ? <StatusMessage error message="Could not sign out. Please retry." /> : null}
    <ActionButton title="Sign out" secondary busy={signingOut} onPress={() => {
      setSigningOut(true); setSignOutError(false);
      void signOut().catch(() => setSignOutError(true)).finally(() => setSigningOut(false));
    }} />
  </Screen>;
}
