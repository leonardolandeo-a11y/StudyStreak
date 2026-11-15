import { Text, View } from 'react-native';
import { useAppearance } from '../../hooks/useAppearance';
import type { Presence } from '../../services/socialService';
export function describePresence(presence: Presence | null | undefined) {
  const status = presence?.status;
  const label = status === 'ONLINE' ? 'Online' : status === 'OFFLINE' ? 'Offline' : status === 'HIDDEN' ? 'Status hidden' : 'Status unavailable';
  const timestamp = presence?.lastSeenAt;
  const lastSeen = timestamp && ['ONLINE','OFFLINE','HIDDEN'].includes(status ?? '') && Number.isFinite(Date.parse(timestamp))
    ? new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(timestamp)) : null;
  return { label, lastSeen };
}
export function PresenceLabel({ presence }: { presence: Presence | null | undefined }) {
  const { theme: { colors } } = useAppearance();
  const { label, lastSeen } = describePresence(presence);
  return <View style={{ gap: 4 }}>
    <Text style={{ color: presence?.status === 'ONLINE' ? colors.success : colors.muted, fontWeight: '600', fontSize: 14 }}>{label}</Text>
    {lastSeen ? <Text style={{ color: colors.muted, fontSize: 12 }}>Last seen {lastSeen}</Text> : null}
  </View>;
}
