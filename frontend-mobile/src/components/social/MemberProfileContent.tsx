import { AcademicHeading, AcademicPanel as Card } from '../academic/Academic';
import { Text, View } from 'react-native';
import { useAppearance } from '../../hooks/useAppearance';
import type { MemberState } from '../../features/social/socialDirectory';
import { ProfileCover } from '../profile/ProfileCover';
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
    <AcademicHeading title="Member profile" eyebrow="TRACKING PARTNER" glyph="people" />
    {!member || member.status === 'loading' ? <StatusMessage message="Loading member profile…" /> : null}
    {member?.status === 'unavailable' ? <StatusMessage error message="Profile unavailable. An accepted Tracking connection is required." /> : null}
    {member?.status === 'error' ? <StatusMessage error message="Could not load this profile. Status and private images are unavailable." /> : null}
    {profile ? <>
      <Card style={{ padding: 12 }}>
        <ProfileCover banner={member?.banner ?? null} avatar={member?.avatar ?? null} name={profile.presentationName || profile.username} />
        <Text accessibilityRole="header" style={{ color: colors.text, fontSize: 24, fontWeight: '700' }}>{profile.presentationName || profile.username}</Text>
        <Text style={{ color: colors.muted }}>@{profile.username}</Text>
        {profile.bio ? <Text style={{ color: colors.text, lineHeight: 23 }}>{profile.bio}</Text> : null}
        {date ? <Text style={{ color: colors.muted, fontSize: 13 }}>Joined {date}</Text> : null}
        <PresenceLabel presence={profile.presence} />
      </Card>
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
