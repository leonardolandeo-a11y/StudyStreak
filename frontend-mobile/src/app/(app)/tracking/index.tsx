import { useCallback, useState } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../components/ui/Screen';
import { ActionButton } from '../../../components/ui/ActionButton';
import { PageControls } from '../../../components/ui/PageControls';
import { StatusMessage } from '../../../components/ui/StatusMessage';
import { PartnerSearch } from '../../../components/tracking/PartnerSearch';
import { TrackingLinkCard } from '../../../components/tracking/TrackingLinkCard';
import { useAuth } from '../../../hooks/useAuth';
import { usePagedResource } from '../../../hooks/usePagedResource';
import { trackingLinkService } from '../../../services/trackingLinkService';
import { getApiErrorMessage } from '../../../utils/apiError';
import { palette } from '../../../constants/palette';
import type { PageResponse } from '../../../types/page';
import type { TrackingDecision, TrackingLink } from '../../../types/trackingLink';

type SectionMode = 'pending' | 'active' | 'history';

function TrackingSection({ title, emptyMessage, state, mode, currentUserId, busy, onRespond, onRemove }: {
  title: string;
  emptyMessage: string;
  state: {
    page: number;
    setPage: (page: number) => void;
    data: PageResponse<TrackingLink> | null;
    loading: boolean;
    error: string | null;
    reload: () => void;
  };
  mode: SectionMode;
  currentUserId: number;
  busy: boolean;
  onRespond: (id: number, decision: TrackingDecision) => Promise<boolean>;
  onRemove: (id: number) => Promise<boolean>;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Pressable accessibilityRole="button" onPress={state.reload}>
          <Text style={styles.refresh}>Refresh</Text>
        </Pressable>
      </View>
      {state.loading ? <ActivityIndicator color={palette.primary} /> : null}
      {state.error ? (
        <>
          <StatusMessage error message={state.error} />
          <ActionButton title="Retry" secondary onPress={state.reload} />
        </>
      ) : null}
      {!state.loading && !state.error && state.data?.empty ? <Text style={styles.empty}>{emptyMessage}</Text> : null}
      {!state.loading && !state.error && state.data ? (
        <>
          <Text style={styles.count}>{state.data.totalElements} total</Text>
          {state.data.content.map((link) => (
            <TrackingLinkCard key={link.id} link={link} mode={mode} currentUserId={currentUserId}
              busy={busy} onRespond={onRespond} onRemove={onRemove} />
          ))}
          <PageControls page={state.page} totalPages={state.data.totalPages} onChange={state.setPage} />
        </>
      ) : null}
    </View>
  );
}

export default function Tracking() {
  const { currentUser } = useAuth();
  const pendingLoader = useCallback((page: number, signal: AbortSignal) => trackingLinkService.pending(page, signal), []);
  const activeLoader = useCallback((page: number, signal: AbortSignal) => trackingLinkService.active(page, signal), []);
  const historyLoader = useCallback((page: number, signal: AbortSignal) => trackingLinkService.all(page, signal), []);
  const pending = usePagedResource(pendingLoader, currentUser !== null);
  const active = usePagedResource(activeLoader, currentUser !== null);
  const history = usePagedResource(historyLoader, currentUser !== null);
  const [sending, setSending] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function clearMessages() {
    setNotice(null);
    setActionError(null);
  }

  function refreshAll() {
    pending.reload();
    active.reload();
    history.reload();
  }

  async function sendRequest(userId: number): Promise<boolean> {
    if (!currentUser || sending) return false;
    clearMessages();
    if (userId === currentUser.id) {
      setActionError('You cannot send a tracking request to yourself.');
      return false;
    }
    setSending(true);
    try {
      await trackingLinkService.request(userId);
      setNotice('Tracking request sent.');
      if (history.page !== 0) history.setPage(0);
      else history.reload();
      return true;
    } catch (cause) {
      setActionError(getApiErrorMessage(cause, 'Could not send the tracking request.'));
      return false;
    } finally {
      setSending(false);
    }
  }

  async function respond(id: number, decision: TrackingDecision): Promise<boolean> {
    if (busyId !== null) return false;
    clearMessages();
    setBusyId(id);
    try {
      await trackingLinkService.respond(id, decision);
      setNotice(decision === 'ACCEPTED' ? 'Request accepted.' : 'Request rejected.');
      if (pending.data?.content.length === 1 && pending.page > 0) pending.setPage(pending.page - 1);
      else pending.reload();
      active.reload();
      history.reload();
      return true;
    } catch (cause) {
      setActionError(getApiErrorMessage(cause, 'Could not update the request.'));
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: number): Promise<boolean> {
    if (busyId !== null) return false;
    clearMessages();
    setBusyId(id);
    try {
      await trackingLinkService.remove(id);
      setNotice('Tracking link removed.');
      if (pending.data?.content.length === 1 && pending.page > 0) pending.setPage(pending.page - 1);
      else pending.reload();
      if (active.data?.content.length === 1 && active.page > 0) active.setPage(active.page - 1);
      else active.reload();
      if (history.data?.content.length === 1 && history.page > 0) history.setPage(history.page - 1);
      else history.reload();
      return true;
    } catch (cause) {
      setActionError(getApiErrorMessage(cause, 'Could not remove the tracking link.'));
      return false;
    } finally {
      setBusyId(null);
    }
  }

  if (!currentUser) return null;

  return (
    <Screen>
      <Pressable accessibilityRole="button" onPress={() => router.back()}><Text style={styles.back}>‹ Home</Text></Pressable>
      <Text style={styles.title}>Tracking Links</Text>
      <Text style={styles.subtitle}>Connect with study partners and validate progress together.</Text>
      <PartnerSearch busy={sending} onSend={sendRequest} />
      {notice ? <StatusMessage message={notice} /> : null}
      {actionError ? <StatusMessage error message={actionError} /> : null}
      <ActionButton title="Refresh all connections" secondary onPress={refreshAll} />
      <TrackingSection title="Pending invitations" emptyMessage="You have no pending invitations."
        state={pending} mode="pending" currentUserId={currentUser.id} busy={busyId !== null}
        onRespond={respond} onRemove={remove} />
      <TrackingSection title="Active partners" emptyMessage="You do not have an active partner yet."
        state={active} mode="active" currentUserId={currentUser.id} busy={busyId !== null}
        onRespond={respond} onRemove={remove} />
      <TrackingSection title="All tracking links" emptyMessage="No tracking history yet."
        state={history} mode="history" currentUserId={currentUser.id} busy={busyId !== null}
        onRespond={respond} onRemove={remove} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { color: palette.primary, fontSize: 16, paddingVertical: 4 },
  title: { color: palette.text, fontSize: 30, fontWeight: '800' },
  subtitle: { color: palette.muted, fontSize: 14, lineHeight: 22 },
  section: { gap: 12, paddingTop: 6 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  sectionTitle: { color: palette.text, fontSize: 20, fontWeight: '700', flex: 1 },
  refresh: { color: palette.primary, fontSize: 14, fontWeight: '700' },
  count: { color: palette.muted, fontSize: 12 },
  empty: { color: palette.muted, fontSize: 14, backgroundColor: palette.surface, padding: 18, borderRadius: 12 },
});
