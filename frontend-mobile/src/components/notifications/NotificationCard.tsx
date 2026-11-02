import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '../ui/ActionButton';
import { palette } from '../../constants/palette';
import type { Notification } from '../../types/notification';
import { notificationTypeLabels } from '../../types/notification';
import { notificationActionLabel } from '../../utils/notificationDestination';

interface Props {
  notification: Notification;
  busy: boolean;
  disabled: boolean;
  onMarkRead: () => void;
  onOpen: () => void;
  onDelete: () => void;
}

export function NotificationCard({ notification, busy, disabled, onMarkRead, onDelete, onOpen }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const formattedDate = new Date(notification.createdAt);
  const dateText = Number.isNaN(formattedDate.getTime())
    ? notification.createdAt
    : formattedDate.toLocaleString();

  return (
    <View style={[styles.card, !notification.read && styles.unread]}>
      <View style={styles.header}>
        <Text style={[styles.status, notification.read && styles.readStatus]}>
          {notification.read ? 'Read' : 'Unread'}
        </Text>
        <Text style={styles.type}>{notificationTypeLabels[notification.type] ?? notification.type}</Text>
      </View>
      <Pressable accessibilityRole="button" disabled={disabled} onPress={onOpen}
        accessibilityLabel={`${notificationActionLabel(notification)}: ${notification.message}`}>
        <Text style={styles.message}>{notification.message}</Text>
        <Text style={styles.date}>{dateText}</Text>
      </Pressable>
      {confirmDelete ? (
        <View style={styles.actions}>
          <Text style={styles.warning}>Delete this notification permanently?</Text>
          <ActionButton title="Confirm delete" disabled={disabled} busy={busy} onPress={onDelete} />
          <ActionButton title="Cancel" secondary disabled={busy} onPress={() => setConfirmDelete(false)} />
        </View>
      ) : (
        <View style={styles.actions}>
          <ActionButton title={notificationActionLabel(notification)} disabled={disabled}
            busy={busy} onPress={onOpen} />
          {!notification.read ? (
            <ActionButton title="Mark as read" secondary disabled={disabled} busy={busy} onPress={onMarkRead} />
          ) : null}
          <ActionButton title="Delete" secondary disabled={disabled} onPress={() => setConfirmDelete(true)} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 12, borderWidth: 1, borderColor: palette.border,
    borderRadius: 16, backgroundColor: palette.surface },
  unread: { borderColor: palette.primary },
  header: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  status: { color: palette.primary, fontSize: 12, fontWeight: '800' },
  readStatus: { color: palette.muted },
  type: { color: palette.muted, fontSize: 12 },
  message: { color: palette.text, fontSize: 15, lineHeight: 23 },
  date: { color: palette.muted, fontSize: 12 },
  warning: { color: palette.error, fontWeight: '700', fontSize: 13 },
  actions: { gap: 9 },
});
