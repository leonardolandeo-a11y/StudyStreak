import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '../ui/ActionButton';
import { useAppearance } from '../../hooks/useAppearance';
import type { ThemeColors } from '../../features/appearance/theme';
import { workspacePalette } from '../academic/workspacePalette';
import { SocialAvatar } from '../social/MemberReference';
import { router } from 'expo-router';
import { useSocialMember } from '../../contexts/SocialContext';
import { NavigationPressable } from '../navigation/NavigationPressable';
import { AppIcon } from '../ui/AppIcon';
import type { TrackingDecision, TrackingLink } from '../../types/trackingLink';

type Mode = 'pending' | 'active' | 'history';

export function TrackingLinkCard({ link, currentUserId, mode, busy, onRespond, onRemove }: {
  link: TrackingLink;
  currentUserId: number;
  mode: Mode;
  busy: boolean;
  onRespond: (id: number, decision: TrackingDecision) => Promise<boolean>;
  onRemove: (id: number) => Promise<boolean>;
}) {
  const { theme, reduceMotion } = useAppearance();
  const colors = workspacePalette(theme);
  const styles = createStyles(colors);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const isRequester = link.requesterId === currentUserId;
  const username = isRequester ? link.receiverUsername : link.requesterUsername;
  const partnerId = isRequester ? link.receiverId : link.requesterId;
  const { accepted } = useSocialMember(partnerId);
  const identity = <><SocialAvatar userId={partnerId} name={username || 'Unknown user'} size={46} /><Text numberOfLines={1} style={[styles.user, { flex: 1, minWidth: 0 }]}>@{username || 'Unknown user'}</Text></>;
  const statusText = link.status === 'ACCEPTED' ? 'Accepted' : link.status === 'REJECTED' ? 'Rejected' : isRequester ? 'Request sent' : 'Awaiting your response';
  const removeLabel = link.status === 'PENDING' ? (isRequester ? 'Cancel request' : 'Remove request') : link.status === 'ACCEPTED' ? 'Remove connection' : 'Remove link';

  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        {accepted ? <NavigationPressable accessibilityRole="button" accessibilityLabel={`View profile of ${username}`} onPress={() => router.push({ pathname: '/(app)/users/[userId]/profile', params: { userId: String(partnerId) } })} style={({ pressed }) => [styles.identity, { opacity: pressed ? .8 : 1, transform: [{ scale: pressed && !reduceMotion ? .98 : 1 }] }]}>{identity}</NavigationPressable> : <View style={styles.identity}>{identity}</View>}
        {(mode !== 'pending' && !confirmRemove) ? <NavigationPressable accessibilityRole="button" accessibilityLabel={removeLabel} disabled={busy} accessibilityState={{ disabled: busy }} onPress={() => setConfirmRemove(true)} style={{ width: 48, height: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center', opacity: busy ? .5 : 1 }}><AppIcon name="trash" color={styles.destructive.color} size={21}/></NavigationPressable> : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Text style={[styles.status, link.status === 'ACCEPTED' && styles.accepted]}>{statusText}</Text><Text style={{ color: colors.muted, fontSize: 11 }}>{isRequester ? 'Sent' : 'Received'}</Text></View>
      {mode === 'pending' ? (
        <View style={styles.buttons}>
          <View style={styles.action}><ActionButton compact title="Accept" disabled={busy} onPress={() => { void onRespond(link.id, 'ACCEPTED'); }} /></View>
          <View style={styles.action}><ActionButton compact title="Reject" secondary disabled={busy} onPress={() => { void onRespond(link.id, 'REJECTED'); }} /></View>
        </View>
      ) : null}
      {confirmRemove ? (
        <View style={styles.confirm}>
          <Text style={styles.confirmText}>Remove this tracking link?</Text>
          <View style={styles.buttons}>
            <View style={styles.action}><ActionButton compact title="Keep" secondary disabled={busy} onPress={() => setConfirmRemove(false)} /></View>
            <View style={styles.action}><NavigationPressable accessibilityRole="button" accessibilityLabel="Remove" accessibilityState={{ disabled: busy, busy }} disabled={busy} onPress={() => {
              void onRemove(link.id).then((removed) => { if (removed) setConfirmRemove(false); });
            }} style={styles.removeButton}><Text style={[styles.destructive, { fontWeight: '700' }]}>{busy ? 'Removing…' : 'Remove'}</Text></NavigationPressable></View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (palette: ThemeColors) => StyleSheet.create({
  card: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, gap: 10 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0, minHeight: 48, borderRadius: 6 },
  destructive: { color: palette.error },
  removeButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, borderRadius: 8, backgroundColor: palette.errorSurface },
  user: { color: palette.text, fontWeight: '700', fontSize: 16 },
  status: { fontWeight: '600', fontSize: 12, color: palette.muted },
  accepted: { color: palette.success, backgroundColor: palette.successSurface, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  buttons: { flexDirection: 'row', gap: 10 },
  action: { flex: 1 },
  confirm: { gap: 10, paddingTop: 4 },
  confirmText: { color: palette.text, fontSize: 14 },
});
