import { useCallback, useState } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../components/ui/Screen';
import { ActionButton } from '../../../components/ui/ActionButton';
import { StatusMessage } from '../../../components/ui/StatusMessage';
import { PageControls } from '../../../components/ui/PageControls';
import { NotificationCard } from '../../../components/notifications/NotificationCard';
import { useAuth } from '../../../hooks/useAuth';
import { usePagedResource } from '../../../hooks/usePagedResource';
import { notificationService } from '../../../services/notificationService';
import { getApiErrorMessage } from '../../../utils/apiError';
import { palette } from '../../../constants/palette';
import { notificationTypeLabels, notificationTypes } from '../../../types/notification';
import { notificationDestination } from '../../../utils/notificationDestination';
import type { Notification, NotificationType } from '../../../types/notification';
import type { PageResponse } from '../../../types/page';

type Filter = 'all' | 'unread' | 'type';

export default function Notifications() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedType, setSelectedType] = useState<NotificationType>('VALIDATION_RECEIVED');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback((page: number, signal: AbortSignal): Promise<PageResponse<Notification>> => {
    if (userId == null) throw new Error('Not signed in');
    if (filter === 'unread') return notificationService.unread(userId, page, signal);
    if (filter === 'type') return notificationService.byType(userId, selectedType, page, signal);
    return notificationService.list(userId, page, signal);
  }, [userId, filter, selectedType]);

  const { page, setPage, data, loading, error, reload } = usePagedResource(load, userId != null, 30000);

  function selectFilter(next: Filter, type?: NotificationType) {
    setFilter(next);
    if (type) setSelectedType(type);
    setPage(0);
    setActionError(null);
    setMessage(null);
  }

  async function runAction(id: number, action: 'read' | 'delete') {
    if (userId == null || busyId !== null) return;
    setBusyId(id);
    setActionError(null);
    setMessage(null);
    try {
      if (action === 'read') await notificationService.markRead(userId, id);
      else await notificationService.remove(userId, id);
      setMessage(action === 'read' ? 'Notification marked as read.' : 'Notification deleted.');
      if ((action === 'delete' || filter === 'unread') && page > 0 && data?.content.length === 1) {
        setPage(page - 1);
      } else {
        reload();
      }
    } catch (cause) {
      setActionError(getApiErrorMessage(cause, 'Could not update the notification.'));
    } finally {
      setBusyId(null);
    }
  }

  async function openNotification(notification: Notification) {
    if (userId == null || busyId !== null) return;
    setBusyId(notification.id);
    setActionError(null);
    if (!notification.read) {
      try {
        await notificationService.markRead(userId, notification.id);
        reload();
      } catch (cause) {
        setActionError(getApiErrorMessage(cause, 'Could not mark notification as read.'));
      }
    }
    setBusyId(null);
    const target = notificationDestination(notification);
    switch (target.kind) {
      case 'newRecord':
        router.push({
          pathname: '/(app)/goals/[goalId]/records/[recordId]',
          params: { goalId: String(target.goalId), recordId: String(target.recordId), review: '1' },
        });
        break;
      case 'validations': router.push('/(app)/validations'); break;
      case 'reviewedRecord':
        router.push({
          pathname: '/(app)/goals/[goalId]/records/[recordId]',
          params: { goalId: String(target.goalId), recordId: String(target.recordId) },
        });
        break;
      case 'goal':
        router.push({ pathname: '/(app)/goals/[goalId]', params: { goalId: String(target.goalId) } });
        break;
      case 'goals': router.push('/(app)/goals'); break;
      case 'tracking': router.push('/(app)/tracking'); break;
      case 'home': router.push('/(app)/home'); break;
    }
  }

  if (!currentUser) return null;

  return (
    <Screen>
      <Pressable accessibilityRole="button" onPress={() => router.back()}>
        <Text style={styles.back}>‹ Home</Text>
      </Pressable>
      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.subtitle}>Stay informed about your goals and study partners.</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters} style={styles.filterBar}>
        <FilterChip label="All" active={filter === 'all'} onPress={() => selectFilter('all')} />
        <FilterChip label="Unread" active={filter === 'unread'} onPress={() => selectFilter('unread')} />
        {notificationTypes.map((type) => (
          <FilterChip key={type} label={notificationTypeLabels[type]}
            active={filter === 'type' && selectedType === type}
            onPress={() => selectFilter('type', type)} />
        ))}
      </ScrollView>
      <View style={styles.row}>
        <Text style={styles.heading}>{filter === 'unread' ? 'Unread notifications' : filter === 'type' ? notificationTypeLabels[selectedType] : 'All notifications'}</Text>
        <Pressable accessibilityRole="button" onPress={reload}>
          <Text style={styles.refresh}>Refresh</Text>
        </Pressable>
      </View>
      {message ? <StatusMessage message={message} /> : null}
      {actionError ? <StatusMessage message={actionError} error /> : null}
      {loading ? <ActivityIndicator size="large" color={palette.primary} /> : null}
      {error ? (
        <>
          <StatusMessage error message={error} />
          <ActionButton title="Retry" secondary onPress={reload} />
        </>
      ) : null}
      {!loading && !error && data ? (
        <>
          <Text style={styles.count}>{data.totalElements} notifications</Text>
          {data.content.length === 0 ? <Text style={styles.empty}>No notifications in this category.</Text> : null}
          {data.content.map((notification) => (
            <NotificationCard key={notification.id} notification={notification}
              busy={busyId === notification.id}
              disabled={busyId !== null}
              onMarkRead={() => { void runAction(notification.id, 'read'); }}
              onOpen={() => { void openNotification(notification); }}
              onDelete={() => { void runAction(notification.id, 'delete'); }} />
          ))}
          <PageControls page={page} totalPages={data.totalPages} onChange={setPage} />
        </>
      ) : null}
    </Screen>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: active }}
      onPress={onPress} style={[styles.chip, active && styles.activeChip]}>
      <Text style={[styles.chipText, active && styles.activeChipText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  back: { color: palette.primary, fontSize: 16, paddingVertical: 4 },
  title: { color: palette.text, fontSize: 30, fontWeight: '800' },
  subtitle: { color: palette.muted, fontSize: 14, lineHeight: 22 },
  filterBar: { flexGrow: 0 },
  filters: { gap: 8, paddingVertical: 6, alignItems: 'center' },
  chip: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1,
    borderColor: palette.border, backgroundColor: palette.surface },
  activeChip: { backgroundColor: palette.primary, borderColor: palette.primary },
  chipText: { fontSize: 13, color: palette.muted, fontWeight: '700' },
  activeChipText: { color: palette.primaryText },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, alignItems: 'center' },
  heading: { color: palette.text, fontSize: 19, fontWeight: '700', flex: 1 },
  refresh: { color: palette.primary, fontSize: 14, fontWeight: '700' },
  count: { color: palette.muted, fontSize: 12 },
  empty: { color: palette.muted, fontSize: 14, padding: 18, backgroundColor: palette.surface,
    borderRadius: 12 },
});
