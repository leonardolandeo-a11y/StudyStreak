import { AcademicHeading, AcademicPanel as Card } from '../../components/academic/Academic';
import { Text } from 'react-native';
import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAppearance } from '../../hooks/useAppearance';
import { useNavigationData } from '../../contexts/NavigationDataContext';
import { Screen } from '../../components/ui/Screen';
import { StatusMessage } from '../../components/ui/StatusMessage';
import { ActionButton } from '../../components/ui/ActionButton';
import { ProfileCover } from '../../components/profile/ProfileCover';
import { ProfileEditor } from '../../components/profile/ProfileEditor';
import { ProfileStudyStats } from '../../components/profile/ProfileStudyStats';
export default function Profile() {
  const { currentUser, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const { theme } = useAppearance();
  const { profile, avatar, banner, imageErrors, loading, error, retry, ensureBanner } = useNavigationData();
  useEffect(() => { void ensureBanner(); }, [ensureBanner]);
  const name = profile?.presentationName || currentUser?.username || 'StudyStreak';
  const date = profile?.registrationDate;
  const joined = date && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(`${date}T12:00:00Z`)) && new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) === date
    ? new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`)) : null;
  return <>
    <Screen themed compact onRefresh={retry} refreshing={loading}>
    <AcademicHeading title="Profile" eyebrow="YOUR SPACE" glyph="book" />
      {saved ? <StatusMessage variant="success" message="Profile saved." /> : null}
      {loading ? <StatusMessage message="Loading your profile…" /> : null}
      {error ? <><StatusMessage error message={error} /><ActionButton title="Retry profile" onPress={retry} /></> : null}
      {profile ? <>
        <Card style={{ padding: 12 }}>
          <ProfileCover avatar={avatar} banner={banner ?? null} name={name} />
          <Text accessibilityRole="header" style={{ color: theme.colors.text, fontSize: 24, fontWeight: '700' }}>{name}</Text>
          <Text style={{ color: theme.colors.muted }}>@{profile.username}</Text>
          {profile.bio ? <Text style={{ color: theme.colors.text, lineHeight: 23 }}>{profile.bio}</Text> : null}
          {joined ? <Text style={{ color: theme.colors.muted, fontSize: 13 }}>Joined {joined}</Text> : null}
          <ActionButton title="Edit Profile" onPress={() => { setSaved(false); setEditing(true); }} />
          {imageErrors?.avatar || imageErrors?.banner ? <>
            {imageErrors.avatar ? <StatusMessage error message={`Avatar: ${imageErrors.avatar}`} /> : null}
            {imageErrors.banner ? <StatusMessage error message={`Banner: ${imageErrors.banner}`} /> : null}
            <ActionButton title="Retry profile images" secondary onPress={retry} disabled={loading} />
          </> : null}
        </Card>
        <ProfileStudyStats statistics={profile.statistics} />
      </> : null}
      {signOutError ? <StatusMessage error message="Could not sign out. Please retry." /> : null}
      <ActionButton title="Sign out" secondary busy={signingOut} onPress={() => {
        setSigningOut(true); setSignOutError(false);
        void signOut().catch(() => setSignOutError(true)).finally(() => setSigningOut(false));
      }} />
    </Screen>
    {editing && profile ? <ProfileEditor profile={profile} onClose={() => setEditing(false)} onSaved={() => setSaved(true)} /> : null}
  </>;
}
