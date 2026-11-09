import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '../ui/ActionButton';
import { useThemedStyles } from '../../hooks/useAppearance';
import type { ThemeColors } from '../../features/appearance/theme';
import { SocialAvatar, MemberProfileLink } from '../social/MemberReference';
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
  const styles = useThemedStyles(createStyles);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const isRequester = link.requesterId === currentUserId;
  const username = isRequester ? link.receiverUsername : link.requesterUsername;
  const partnerId = isRequester ? link.receiverId : link.requesterId;
  const statusText = link.status === 'ACCEPTED' ? 'Connected' : link.status === 'REJECTED' ? 'Rejected' : isRequester ? 'Request sent' : 'Awaiting your response';
  const removeLabel = link.status === 'PENDING' ? (isRequester ? 'Cancel request' : 'Remove request') : link.status === 'ACCEPTED' ? 'Remove connection' : 'Remove link';

  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <SocialAvatar userId={partnerId} name={username || 'Unknown user'} />
        <Text numberOfLines={1} style={[styles.user, { flex: 1, minWidth: 0 }]}>@{username || 'Unknown user'}</Text>
        <Text style={[styles.status, link.status === 'ACCEPTED' && styles.accepted]}>{statusText}</Text>
      </View>
      <MemberProfileLink userId={partnerId} name={username} />
      {mode === 'pending' ? (
        <View style={styles.buttons}>
          <View style={styles.action}><ActionButton title="Accept" disabled={busy} onPress={() => { void onRespond(link.id, 'ACCEPTED'); }} /></View>
          <View style={styles.action}><ActionButton title="Reject" secondary disabled={busy} onPress={() => { void onRespond(link.id, 'REJECTED'); }} /></View>
        </View>
      ) : null}
      {(mode !== 'pending' && !confirmRemove) ? (
        <ActionButton title={removeLabel} secondary disabled={busy} onPress={() => setConfirmRemove(true)} />
      ) : null}
      {confirmRemove ? (
        <View style={styles.confirm}>
          <Text style={styles.confirmText}>Remove this tracking link?</Text>
          <View style={styles.buttons}>
            <View style={styles.action}><ActionButton title="Keep" secondary disabled={busy} onPress={() => setConfirmRemove(false)} /></View>
            <View style={styles.action}><ActionButton title="Remove" busy={busy} onPress={() => {
              void onRemove(link.id).then((removed) => { if (removed) setConfirmRemove(false); });
            }} /></View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (palette: ThemeColors) => StyleSheet.create({
  card: { padding: 17, borderRadius: 14, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, gap: 13 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  user: { color: palette.text, fontWeight: '700', fontSize: 17 },
  status: { fontWeight: '600', fontSize: 12, color: palette.muted },
  accepted: { color: palette.success },
  buttons: { flexDirection: 'row', gap: 10 },
  action: { flex: 1 },
  confirm: { gap: 10, paddingTop: 4 },
  confirmText: { color: palette.text, fontSize: 14 },
});
