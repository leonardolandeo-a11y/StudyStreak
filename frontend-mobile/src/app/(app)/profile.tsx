import { Text } from 'react-native';
import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAppearance } from '../../hooks/useAppearance';
import { useNavigationData } from '../../contexts/NavigationDataContext';
import { Screen } from '../../components/ui/Screen';
import { StatusMessage } from '../../components/ui/StatusMessage';
import { ActionButton } from '../../components/ui/ActionButton';
import { ProfileHeader } from '../../components/profile/ProfileHeader';
import { ProfileEditor } from '../../components/profile/ProfileEditor';
import { ProfileStudyStats } from '../../components/profile/ProfileStudyStats';
export default function Profile() {
  const { currentUser } = useAuth();
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
      {saved ? <StatusMessage variant="success" message="Profile saved." /> : null}
      {loading ? <StatusMessage message="Loading your profile…" /> : null}
      {error ? <><StatusMessage error message={error} /><ActionButton title="Retry profile" onPress={retry} /></> : null}
      {profile ? <>
        <ProfileHeader avatar={avatar} banner={banner ?? null} name={name} username={profile.username} bio={profile.bio}
          onEdit={profile.id===currentUser?.id ? () => { setSaved(false); setEditing(true); } : undefined}>
          {joined ? <Text style={{ color: theme.colors.muted, fontSize: 13 }}>Joined {joined}</Text> : null}
          {imageErrors?.avatar || imageErrors?.banner ? <>
            {imageErrors.avatar ? <StatusMessage error message={`Avatar: ${imageErrors.avatar}`} /> : null}
            {imageErrors.banner ? <StatusMessage error message={`Banner: ${imageErrors.banner}`} /> : null}
            <ActionButton title="Retry profile images" secondary onPress={retry} disabled={loading} />
          </> : null}
        </ProfileHeader>
        <ProfileStudyStats statistics={profile.statistics} />
      </> : null}
    </Screen>
    {editing && profile ? <ProfileEditor profile={profile} onClose={() => setEditing(false)} onSaved={() => setSaved(true)} /> : null}
  </>;
}
