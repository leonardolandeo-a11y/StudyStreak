import { Text, View } from 'react-native';
import { useAppearance } from '../../hooks/useAppearance';
import type { MemberState } from '../../features/social/socialDirectory';
import { ProfileHeader } from '../profile/ProfileHeader';
import { PresenceLabel } from './PresenceLabel';
import { Screen } from '../ui/Screen';
import { StatusMessage } from '../ui/StatusMessage';
import { ActionButton } from '../ui/ActionButton';
export function MemberProfileContent({ member, onRefresh }: { member: MemberState | undefined; onRefresh(): void }) {
  const { theme: { colors } } = useAppearance();
  const profile = member?.profile;
  const rawDate = profile?.registrationDate;
  const date = rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) && Number.isFinite(Date.parse(`${rawDate}T12:00:00Z`))
    && new Date(`${rawDate}T12:00:00Z`).toISOString().slice(0,10) === rawDate
    ? new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${rawDate}T12:00:00Z`)) : null;
  return <Screen themed compact>
    {!member || member.status === 'loading' ? <StatusMessage message="Loading member profile…" /> : null}
    {member?.status === 'unavailable' ? <StatusMessage error message="Profile unavailable. An accepted Tracking connection is required." /> : null}
    {member?.status === 'error' ? <StatusMessage error message="Could not load this profile. Status and private images are unavailable." /> : null}
    {profile ? <>
      <ProfileHeader banner={member?.banner ?? null} avatar={member?.avatar ?? null} name={profile.presentationName || profile.username} username={profile.username} bio={profile.bio}>
        {date ? <Text style={{ color: colors.muted, fontSize: 13 }}>Joined {date}</Text> : null}
        <PresenceLabel presence={profile.presence} />
      </ProfileHeader>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {([['verifiedMinutes','Verified focus time',' min'],['verifiedSessions','Verified sessions','']] as const).map(([field,label,unit]) => {
          const value = profile.statistics?.[field];
          return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? <View key={field} style={{ flexGrow: 1, flexBasis: '45%', minWidth: 120, backgroundColor: colors.surface, padding: 12, borderRadius: 8, gap: 6 }}>
            <Text style={{ color: colors.muted, fontSize: 13 }}>{label}</Text>
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700' }}>{new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(value)}{unit}</Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>Shared by this member</Text>
          </View> : null;
        })}
      </View>
      {member?.imageError ? <StatusMessage message="Some images could not be loaded. Refresh to retry." /> : null}
    </> : null}
    <ActionButton title="Refresh member profile" secondary onPress={() => { onRefresh(); }} />
  </Screen>;
}
