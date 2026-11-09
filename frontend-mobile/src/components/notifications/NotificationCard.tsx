import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationPressable } from '../navigation/NavigationPressable';
import { ActionButton } from '../ui/ActionButton';
import { useThemedStyles } from '../../hooks/useAppearance';
import type { ThemeColors } from '../../features/appearance/theme';
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
  const styles = useThemedStyles(createStyles);
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
      <NavigationPressable accessibilityRole="button" disabled={disabled} onPress={onOpen}
        accessibilityLabel={`${notificationActionLabel(notification)}: ${notification.message}`}>
        <Text style={styles.message}>{notification.message}</Text>
        <Text style={styles.date}>{dateText}</Text>
      </NavigationPressable>
      {confirmDelete ? (
        <View style={styles.actions}>
          <Text style={styles.warning}>Delete this notification permanently?</Text>
          <ActionButton compact title="Confirm delete" disabled={disabled} busy={busy} onPress={onDelete} />
          <ActionButton compact title="Cancel" secondary disabled={busy} onPress={() => setConfirmDelete(false)} />
        </View>
      ) : (
        <View style={styles.actions}>
          <ActionButton compact title={notificationActionLabel(notification)} disabled={disabled}
            busy={busy} onPress={onOpen} />
          {!notification.read ? (
            <ActionButton compact title="Mark as read" secondary disabled={disabled} busy={busy} onPress={onMarkRead} />
          ) : null}
          <ActionButton compact title="Delete" secondary disabled={disabled} onPress={() => setConfirmDelete(true)} />
        </View>
      )}
    </View>
  );
}

const createStyles = (palette: ThemeColors) => StyleSheet.create({
  card: { padding: 16, gap: 12, borderWidth: 1, borderColor: palette.border,
    borderRadius: 12, backgroundColor: palette.surface },
  unread: { borderColor: palette.primary },
  header: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  status: { color: palette.primary, fontSize: 12, fontWeight: '800' },
  readStatus: { color: palette.muted },
  type: { color: palette.muted, fontSize: 12 },
  message: { color: palette.text, fontSize: 15, lineHeight: 23 },
  date: { color: palette.muted, fontSize: 12 },
  warning: { color: palette.error, fontWeight: '700', fontSize: 13 },
  actions: { gap: 8, flexDirection: 'row', flexWrap: 'wrap' },
});
