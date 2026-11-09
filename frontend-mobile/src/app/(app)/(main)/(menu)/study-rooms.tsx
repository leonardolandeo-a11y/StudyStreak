import { RoomModeration } from "../../../../components/media/RoomModeration";
import { RoomCollaboration } from "../../../../components/media/RoomCollaboration";
import { RoomMedia } from "../../../../components/media/RoomMedia";
import { ParticipantCard } from "../../../../components/study/ParticipantCard";
import { StudyRoomGoal } from "../../../../components/focus/StudyRoomGoal";
import { useCallback, useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { useFocusEffect } from 'expo-router';
import { useMenuAction } from '../../../../contexts/MenuActionContext';
import {
  ActivityIndicator, AppState,
  StyleSheet, Text, TextInput, View, Share,
} from 'react-native';
import type { ThemeColors } from '../../../../features/appearance/theme';
import { NavigationPressable } from '../../../../components/navigation/NavigationPressable';
import { useAppearance, useThemedStyles } from '../../../../hooks/useAppearance';
import { CreationModal } from '../../../../components/ui/CreationModal';
import { Screen } from '../../../../components/ui/Screen';
import { ActionButton } from '../../../../components/ui/ActionButton';
import { useAuth } from '../../../../hooks/useAuth';
import { getApiErrorMessage } from '../../../../utils/apiError';
import {
  displayRoomTime, sharedTimeRemaining, studyRoomService,
} from '../../../../services/studyRoomService';
import type { StudyRoom, StudyRoomAction } from '../../../../services/studyRoomService';

import { isNewerRoom } from "../../../../services/studyRoomClock";

type Snapshot = { room: StudyRoom; receivedAt: number };

export default function StudyRooms() {
  const { currentUser } = useAuth();
  const { theme } = useAppearance();
  const styles = useThemedStyles(createStyles);
  const [confirmation, setConfirmation] = useState<{ title: string; message: string; label: string; run(): void } | null>(null);
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [code, setCode] = useState('');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const studying = snapshot?.room.members.find(member => member.userId === currentUser?.id)?.studying ?? false;

  const [now, setNow] = useState(() => performance.now());
  const [confirmed,setConfirmed]=useState(false);
  const [refreshingView,setRefreshingView]=useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const menuScroll = useMenuAction('Create a study room', () => { setError(null); setShowCreate(true); }, showCreate || roomId !== null, () => {
    if (busy) return;
    setShowCreate(false); setRoomId(null); setSnapshot(null);
  });



  const showRoom = useCallback((room: StudyRoom) => {
    setConfirmed(false);
    setSnapshot({ room, receivedAt: performance.now() });
    setRoomId(room.id);
    setError(null);
  }, []);

  const acceptRoom = useCallback((room: StudyRoom) => {
    setConfirmed(true);
    setSnapshot(previous => previous && isNewerRoom(previous.room, room)
      ? { room, receivedAt: performance.now() } : previous);
  }, []);

  const refreshLobby = useCallback(async () => {
    setLoading(true);
    try { setRooms(await studyRoomService.list()); setError(null); }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    void studyRoomService.list(controller.signal).then(data => {
      if (!controller.signal.aborted) { setRooms(data); setLoading(false); }
    }).catch(() => {
      if (!controller.signal.aborted) { setError('Could not load study rooms.'); setLoading(false); }
    });
    return () => controller.abort();
  }, []));

  useFocusEffect(useCallback(() => {
    if (!roomId) return;
    let active = true;
        let refreshing = false;
        let pulsing = false;
    const refresh = async () => {
      if (!active || AppState.currentState !== 'active' || refreshing) return;
      refreshing = true; setRefreshingView(true);
      try {
        const room = await studyRoomService.get(roomId);
        if (active) {
          acceptRoom(room);
          setError(null);
        }
      } catch (cause) {
        if (active) {
          if (isAxiosError(cause) && [403, 404].includes(cause.response?.status ?? 0)) {
            setRoomId(null);
            setSnapshot(null);
            setError('The room was closed or your access changed.');
            void refreshLobby().catch(() => {});
          } else {
            setError(getApiErrorMessage(cause, 'Connection interrupted. Retrying automatically…'));
          }
        }
      } finally { refreshing = false; if(active)setRefreshingView(false); }
    };
    const heartbeat = async () => {
      if (!active || pulsing || AppState.currentState !== 'active') return;
      pulsing = true;
      try {
        const room = await studyRoomService.heartbeat(roomId, null);
        if (active) acceptRoom(room);
      } catch {
        if (active) setError('Presence update failed. Check your connection.');
      } finally { pulsing = false; }
    };
    void heartbeat();
    void refresh();
    const poll = setInterval(() => { void refresh(); }, 4000);
    const pulse = setInterval(() => { void heartbeat(); }, 12000);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') { void heartbeat(); void refresh(); }
    });
    return () => {
      active = false;
      clearInterval(poll);
      clearInterval(pulse);
      subscription.remove();
    };
  }, [roomId, refreshLobby, acceptRoom]));

  useEffect(() => {
    const interval = setInterval(() => setNow(performance.now()), 500);
    return () => clearInterval(interval);
  }, []);

  async function create() {
    if (roomName.trim().length < 3 || roomName.trim().length > 60) {
      setError('Room name must have 3–60 characters.');
      return;
    }
    setBusy(true); setError(null);
    try {
      const room = await studyRoomService.create(roomName.trim());
      setRoomName('');
      setShowCreate(false);
      showRoom(room);
      void refreshLobby().catch(() => {});
    } catch (cause) {
      setError(getApiErrorMessage(cause, 'Could not create study room.'));
    } finally { setBusy(false); }
  }

  async function join() {
    setBusy(true); setError(null);
    try {
      const room = await studyRoomService.join(code);
      setCode('');
      showRoom(room);
      void refreshLobby().catch(() => {});
    } catch (cause) {
      setError(getApiErrorMessage(cause, 'Invalid study room invitation.'));
    } finally { setBusy(false); }
  }

  async function timer(action: StudyRoomAction) {
    if (!snapshot?.room.host || busy || stale) return;
    setBusy(true); setError(null);
    try {
      const room = await studyRoomService.timer(snapshot.room.id, action, snapshot.room.version);
      acceptRoom(room);
    } catch (cause) {
      setError(getApiErrorMessage(cause, 'Could not change shared timer.'));
    } finally { setBusy(false); }
  }

  async function changeStudying() {
    if (!snapshot || busy || stale) return;
    setBusy(true); setError(null);
    try {
      const next = !studying;
      const room = await studyRoomService.heartbeat(snapshot.room.id, next);
      acceptRoom(room);
    } catch (cause) {
      setError(getApiErrorMessage(cause, 'Could not update study status.'));
    } finally { setBusy(false); }
  }

  async function manageRoom(userId?: number) {
    if (!snapshot?.room.host || busy || stale) return;
    setBusy(true);
    try {
      const updated = userId === undefined
        ? await studyRoomService.regenerateCode(snapshot.room.id)
        : await studyRoomService.transferHost(snapshot.room.id, userId);
      acceptRoom(updated);
      setError(null);
    } catch (cause) {
      setError(getApiErrorMessage(cause, 'Room changed or connection interrupted. Please retry.'));
    } finally { setBusy(false); }
  }

  async function leave() {
    if (!snapshot || busy || stale) return;
    setBusy(true); setError(null);
    try {
      await studyRoomService.leave(snapshot.room.id);
      setRoomId(null);
      setSnapshot(null);
      await refreshLobby();
    } catch (cause) {
      setError(getApiErrorMessage(cause, 'Could not leave the room.'));
    } finally { setBusy(false); }
  }

  function askLeave() {
    if (!snapshot) return;
    setConfirmation({ title: snapshot.room.host ? 'Close study room?' : 'Leave study room?',
      message: snapshot.room.host ? 'Closing this room removes everyone. This cannot be undone.' : 'You can rejoin later with the invite code.',
      label: snapshot.room.host ? 'Close room' : 'Leave', run: () => { void leave(); } });
  }

  const stale = snapshot !== null && (!confirmed || now - snapshot.receivedAt > 15_000);
  const room = snapshot?.room;
  const remaining = room && snapshot ? sharedTimeRemaining(room, snapshot.receivedAt, now) : 0;
  const online = room?.members.filter(m => m.online).length ?? 0;
  const studyingCount = room?.members.filter(m => m.online && m.studying).length ?? 0;

  return <>
    <CreationModal visible={confirmation !== null} title={confirmation?.title ?? 'Confirm room action'} busy={busy} showBack={false}
      cancelLabel="Cancel room action" onClose={() => setConfirmation(null)}>
      <Text style={styles.description}>{confirmation?.message}</Text>
      <ActionButton compact title={confirmation?.label ?? 'Confirm'} disabled={busy || stale} onPress={() => {
        const run = confirmation?.run; setConfirmation(null); run?.();
      }} />
      <ActionButton compact secondary title="Keep room unchanged" onPress={() => setConfirmation(null)} />
    </CreationModal>
    <CreationModal visible={showCreate} title="New Study Room" busy={busy} onClose={() => setShowCreate(false)}>
          <View style={{ gap: 12 }}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Create a study room</Text>
            <Text style={[styles.description, { color: theme.colors.muted }]}>Invite up to 11 friends with a private code.</Text>
            <TextInput accessibilityLabel="Room name" placeholder="Late-night calculus"
              placeholderTextColor={theme.colors.muted} value={roomName} maxLength={60}
              onChangeText={setRoomName} style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.borderStrong }]} editable={!busy}/>
            <ActionButton compact title="Create room" busy={busy} onPress={() => { void create(); }}/>
            <ActionButton compact title="Cancel" secondary disabled={busy} onPress={() => setShowCreate(false)} />
          </View>
      {error ? <Text accessibilityRole="alert" style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}
    </CreationModal>
    <Screen themed compact scrollRef={menuScroll}>
      {room ? <ActionButton compact title="All rooms" secondary onPress={() => { setRoomId(null); setSnapshot(null); }} /> : null}
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>● STUDY TOGETHER</Text>
        <Text style={styles.title}>Study Rooms<Text style={styles.green}>.</Text></Text>
        <Text style={styles.description}>Private spaces. One shared Pomodoro. Friends studying together.</Text>
      </View>
      {room && <Text accessibilityLiveRegion="polite" style={styles.description}>{busy ? "Action pending · waiting for server" : error ? "Connection or action needs attention" : stale ? "Reconnecting · waiting for a fresh room state" : refreshingView ? "Updating room…" : "Synced · server confirmed"}</Text>}
      {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}

      {!room ? (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Join friends</Text>
            <Text style={styles.description}>Enter the 10-character invite code.</Text>
            <TextInput accessibilityLabel="Invite code" placeholder="ABCDEFGHIJ"
              placeholderTextColor={theme.colors.muted} value={code} maxLength={10}
              autoCapitalize="characters" autoCorrect={false}
              onChangeText={v => setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              style={[styles.input, styles.codeInput]} editable={!busy}/>
            <ActionButton compact title="Join room" busy={busy} disabled={code.length !== 10}
              onPress={() => { void join(); }}/>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your rooms</Text>
            <ActionButton compact secondary title="Refresh" onPress={() => { void refreshLobby().catch(() => setError('Could not load rooms.')); }}/>
            {loading && <ActivityIndicator color={theme.colors.primary}/>}
            {!loading && rooms.length === 0 && <Text style={styles.description}>No rooms yet. Create one or join with a code.</Text>}
            {rooms.map(item => (
              <NavigationPressable key={item.id} accessibilityRole="button" accessibilityLabel={`Open study room ${item.name}`} onPress={() => showRoom(item)}
                style={styles.roomRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.roomName}>{item.name}</Text>
                  <Text style={styles.description}>{item.members.length}/12 members · {item.members.filter(m => m.online).length} online</Text><Text style={styles.description}>Host: {item.members.find(m=>m.host)?.username ?? "—"} · {item.phase} / {item.timerStatus}</Text>
                </View>
                <Text style={styles.green}>Open ›</Text>
              </NavigationPressable>
            ))}
          </View>
        </>
      ) : (
        <>
          <View style={styles.feature}>
            <Text style={styles.eyebrow}>PRIVATE · INVITE ONLY</Text>
            <Text style={styles.roomTitle}>{room.name}</Text>
            <Text style={styles.description}>{online} online · {studyingCount} studying · {room.members.length}/12 members</Text>
            <View style={styles.inviteBox}>
              <Text style={styles.codeLabel}>INVITATION CODE · Long-press to copy</Text>
              <Text selectable style={styles.inviteCode}>{room.inviteCode}</Text><ActionButton compact secondary title="Share invitation" onPress={()=>{void Share.share({message:`Join my StudyStreak room: ${room.inviteCode}`}).catch(()=>setError("Sharing unavailable. Long-press the code to copy it."));}}/>
            </View>
            <View style={styles.timerBox}>
              <Text style={styles.timerLabel}>{room.phase === 'FOCUS' ? 'SHARED FOCUS' : 'GROUP BREAK'}</Text>
              <Text style={styles.timer}>{displayRoomTime(remaining)}</Text>
              <Text style={styles.description}>{stale ? 'Last known timer · reconnecting' : room.timerStatus === 'PAUSED' ? 'Timer paused' : room.timerStatus === 'COMPLETE' ? 'Session finished · server confirmed' : (room.timerStatus === 'RUNNING' && remaining === 0) ? 'Awaiting server confirmation' : room.timerStatus === 'RUNNING' ? 'Timer running' : 'Waiting for host'}</Text>
            </View>
            {room.host ? (
              <View style={styles.controls}><Text style={styles.timerLabel}>HOST CONTROLS</Text>
                <ActionButton compact title={room.timerStatus === 'RUNNING' && remaining > 0 ? 'Pause timer' : 'Start timer'}
                  busy={busy} disabled={stale} onPress={() => { void timer(room.timerStatus === 'RUNNING' && remaining > 0 ? 'PAUSE' : 'START'); }}/>
                <View style={styles.controlRow}>
                  <NavigationPressable accessibilityRole="button" disabled={busy || stale} style={styles.controlButton}
                    onPress={() => { setConfirmation({title:'Reset shared timer?', message:'Open participation in this round will be cancelled.', label:'Reset', run:()=>{void timer('RESET');}}); }}><Text style={styles.controlText}>↻ Reset</Text></NavigationPressable>
                  <NavigationPressable accessibilityRole="button" disabled={busy || stale} style={styles.controlButton}
                    onPress={() => { setConfirmation({title:'Change phase?', message:'Open participation in this round will be cancelled.', label:'Change phase', run:()=>{void timer(room.phase === 'FOCUS' ? 'BREAK' : 'FOCUS');}}); }}>
                    <Text style={styles.controlText}>{room.phase === 'FOCUS' ? '5-min break' : '25-min focus'}</Text>
                  </NavigationPressable>
                </View>
              </View>
            ) : <Text style={styles.description}>Only the host can control the shared timer.</Text>}
            <NavigationPressable accessibilityRole="button" disabled={busy || stale} onPress={() => { void changeStudying(); }}
              style={[styles.studyButton, studying && styles.studyingActive]}>
              <Text style={[styles.studyButtonText, studying && styles.activeText]}>
                {studying ? '✓ I am studying' : 'Mark me as studying'}
              </Text>
            </NavigationPressable>
          </View>
          <RoomMedia key={`media-${room.id}`} roomId={room.id}/>
                    <RoomModeration key={`moderation-${room.id}`} room={room}/>
                    <RoomCollaboration key={`chat-${room.id}`} room={room} userId={currentUser?.id}/>
          <StudyRoomGoal key={room.id} roomId={room.id}/>
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, padding: 14, borderRadius: 14 }]}>
            <Text style={[styles.cardTitle, { color: theme.colors.text, fontSize: 18, fontWeight: '600' }]}>Participants · {room.members.length}/12</Text>
            {room.host && <ActionButton compact secondary title="Regenerate invitation code" disabled={busy || stale} onPress={() => setConfirmation({title:'Replace invitation?',message:'The previous code will stop working.',label:'Replace',run:()=>{void manageRoom();}})}/> }
            {room.members.map(member => (
              <ParticipantCard key={member.userId} userId={member.userId} name={member.username} host={member.host} online={member.online} studying={member.studying}>
                {room.host && !member.host && <ActionButton compact secondary title="Make host" disabled={busy || stale} onPress={() => setConfirmation({title:'Transfer host?',message:`Give controls to ${member.username}?`,label:'Transfer',run:()=>{void manageRoom(member.userId);}})}/>}
              </ParticipantCard>
            ))}
          </View>
          <Text style={styles.footer}>Room state refreshes every 4 seconds using the server clock. Your optional private Goal records eligible group participation.</Text>
          <ActionButton compact secondary title={room.host ? 'Close room for everyone' : 'Leave room'}
            disabled={busy || stale} onPress={askLeave} />
        </>
      )}
    </Screen>
  </>;
}

const createStyles = (palette: ThemeColors) => StyleSheet.create({
  back: { fontSize: 14, fontWeight: '700', color: palette.primary },
  heading: { gap: 8 },
  eyebrow: { color: palette.primary, fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  title: { color: palette.text, fontSize: 24, fontWeight: '900' },
  green: { color: palette.primary, fontWeight: '800' },
  description: { color: palette.muted, fontSize: 14, lineHeight: 21 },
  card: { borderColor: palette.border, borderWidth: 1, padding: 12, borderRadius: 12, backgroundColor: palette.surface, gap: 13 },
  cardTitle: { color: palette.text, fontSize: 20, fontWeight: '900' },
  input: { borderColor: palette.border, borderWidth: 1, borderRadius: 12, color: palette.text, backgroundColor: palette.background, padding: 14, fontSize: 15 },
  codeInput: { fontWeight: '900', letterSpacing: 3 },
  error: { color: palette.error, padding: 12, borderColor: palette.border, borderWidth: 1, borderRadius: 12 },
  roomRow: { backgroundColor: palette.background, padding: 15, borderRadius: 13, borderColor: palette.border, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 7 },
  roomName: { color: palette.text, fontWeight: '800', fontSize: 15 },
  feature: { borderColor: palette.border, borderWidth: 1, backgroundColor: palette.surface, padding: 12, borderRadius: 12, gap: 12 },
  roomTitle: { color: palette.text, fontSize: 22, fontWeight: '900' },
  inviteBox: { backgroundColor: palette.surfaceRaised, padding: 16, borderRadius: 14, gap: 7 },
  codeLabel: { color: palette.muted, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  inviteCode: { color: palette.primary, letterSpacing: 3, fontWeight: '900', fontSize: 25 },
  timerBox: { backgroundColor: palette.background, borderRadius: 18, paddingVertical: 16, paddingHorizontal: 12, alignItems: 'center', gap: 8 },
  timerLabel: { color: palette.primary, fontSize: 12, letterSpacing: 2, fontWeight: '800' },
  timer: { color: palette.text, fontWeight: '900', fontSize: 48, fontVariant: ['tabular-nums'] },
  controls: { gap: 13 },
  controlRow: { flexWrap: 'wrap', flexDirection: 'row', gap: 8 },
  controlButton: { flex: 1, minWidth: 100, minHeight: 48, backgroundColor: palette.surfaceRaised, padding: 13, borderRadius: 12, alignItems: 'center' },
  controlText: { color: palette.text, fontSize: 13, fontWeight: '800' },
  studyButton: { borderWidth: 1, borderColor: palette.primary, padding: 15, borderRadius: 10, alignItems: 'center' },
  studyingActive: { backgroundColor: palette.primary },
  studyButtonText: { color: palette.primary, fontWeight: '900', fontSize: 15 },
  activeText: { color: palette.primaryText },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  avatar: { borderRadius: 25, backgroundColor: palette.primarySoft, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: palette.primaryText, fontSize: 17, fontWeight: '900' },
  memberName: { color: palette.text, fontWeight: '800', fontSize: 14 },
  footer: { color: palette.muted, fontSize: 12, lineHeight: 19 },
});
