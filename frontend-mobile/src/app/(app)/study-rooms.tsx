import { RoomMedia } from "../../components/media/RoomMedia";
import { ParticipantCard } from "../../components/study/ParticipantCard";
import { StudyRoomGoal } from "../../components/focus/StudyRoomGoal";
import { useCallback, useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { router, useFocusEffect } from 'expo-router';
import {
  ActivityIndicator, Alert, AppState, Pressable,
  StyleSheet, Text, TextInput, View, Share,
} from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { ActionButton } from '../../components/ui/ActionButton';
import { useAuth } from '../../hooks/useAuth';
import { getApiErrorMessage } from '../../utils/apiError';
import {
  displayRoomTime, sharedTimeRemaining, studyRoomService,
} from '../../services/studyRoomService';
import type { StudyRoom, StudyRoomAction } from '../../services/studyRoomService';

import { isNewerRoom } from "../../services/studyRoomClock";

type Snapshot = { room: StudyRoom; receivedAt: number };

export default function StudyRooms() {
  const { currentUser } = useAuth();
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
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
    setRooms(await studyRoomService.list());
    setLoading(false);
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
    Alert.alert(snapshot.room.host ? 'Close study room?' : 'Leave study room?',
      snapshot.room.host ? 'Closing this room removes everyone. This cannot be undone.' :
        'You can rejoin later with the invite code.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: snapshot.room.host ? 'Close room' : 'Leave', style: 'destructive',
          onPress: () => { void leave(); } },
      ]);
  }

  const stale = snapshot !== null && (!confirmed || now - snapshot.receivedAt > 15_000);
  const room = snapshot?.room;
  const remaining = room && snapshot ? sharedTimeRemaining(room, snapshot.receivedAt, now) : 0;
  const online = room?.members.filter(m => m.online).length ?? 0;
  const studyingCount = room?.members.filter(m => m.online && m.studying).length ?? 0;

  return (
    <Screen>
      <Pressable accessibilityRole="button"
        onPress={() => { if (room) { setRoomId(null); setSnapshot(null); } else router.back(); }}>
        <Text style={styles.back}>‹ {room ? 'All rooms' : 'Home'}</Text>
      </Pressable>
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
            <Text style={styles.cardTitle}>Create a study room</Text>
            <Text style={styles.description}>Invite up to 11 friends with a private code.</Text>
            <TextInput accessibilityLabel="Room name" placeholder="Late-night calculus"
              placeholderTextColor="#64748b" value={roomName} maxLength={60}
              onChangeText={setRoomName} style={styles.input} editable={!busy}/>
            <ActionButton title="Create room" busy={busy} onPress={() => { void create(); }}/>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Join friends</Text>
            <Text style={styles.description}>Enter the 10-character invite code.</Text>
            <TextInput accessibilityLabel="Invite code" placeholder="ABCDEFGHIJ"
              placeholderTextColor="#64748b" value={code} maxLength={10}
              autoCapitalize="characters" autoCorrect={false}
              onChangeText={v => setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              style={[styles.input, styles.codeInput]} editable={!busy}/>
            <ActionButton title="Join room" busy={busy} disabled={code.length !== 10}
              onPress={() => { void join(); }}/>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your rooms</Text>
            <ActionButton secondary title="Refresh" onPress={() => { void refreshLobby().catch(() => setError('Could not load rooms.')); }}/>
            {loading && <ActivityIndicator color="#4ade80"/>}
            {!loading && rooms.length === 0 && <Text style={styles.description}>No rooms yet. Create one or join with a code.</Text>}
            {rooms.map(item => (
              <Pressable key={item.id} accessibilityRole="button" onPress={() => showRoom(item)}
                style={styles.roomRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.roomName}>{item.name}</Text>
                  <Text style={styles.description}>{item.members.length}/12 members · {item.members.filter(m => m.online).length} online</Text><Text style={styles.description}>Host: {item.members.find(m=>m.host)?.username ?? "—"} · {item.phase} / {item.timerStatus}</Text>
                </View>
                <Text style={styles.green}>Open ›</Text>
              </Pressable>
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
              <Text selectable style={styles.inviteCode}>{room.inviteCode}</Text><ActionButton secondary title="Share invitation" onPress={()=>{void Share.share({message:`Join my StudyStreak room: ${room.inviteCode}`}).catch(()=>setError("Sharing unavailable. Long-press the code to copy it."));}}/>
            </View>
            <View style={styles.timerBox}>
              <Text style={styles.timerLabel}>{room.phase === 'FOCUS' ? 'SHARED FOCUS' : 'GROUP BREAK'}</Text>
              <Text style={styles.timer}>{displayRoomTime(remaining)}</Text>
              <Text style={styles.description}>{stale ? 'Last known timer · reconnecting' : room.timerStatus === 'PAUSED' ? 'Timer paused' : room.timerStatus === 'COMPLETE' ? 'Session finished · server confirmed' : (room.timerStatus === 'RUNNING' && remaining === 0) ? 'Awaiting server confirmation' : room.timerStatus === 'RUNNING' ? 'Timer running' : 'Waiting for host'}</Text>
            </View>
            {room.host ? (
              <View style={styles.controls}><Text style={styles.timerLabel}>HOST CONTROLS</Text>
                <ActionButton title={room.timerStatus === 'RUNNING' && remaining > 0 ? 'Pause timer' : 'Start timer'}
                  busy={busy} disabled={stale} onPress={() => { void timer(room.timerStatus === 'RUNNING' && remaining > 0 ? 'PAUSE' : 'START'); }}/>
                <View style={styles.controlRow}>
                  <Pressable accessibilityRole="button" disabled={busy || stale} style={styles.controlButton}
                    onPress={() => { Alert.alert('Reset shared timer?', 'Open participation in this round will be cancelled.', [{text:'Cancel',style:'cancel'},{text:'Reset',style:'destructive',onPress:()=>{void timer('RESET');}}]); }}><Text style={styles.controlText}>↻ Reset</Text></Pressable>
                  <Pressable accessibilityRole="button" disabled={busy || stale} style={styles.controlButton}
                    onPress={() => { Alert.alert('Change phase?', 'Open participation in this round will be cancelled.', [{text:'Cancel',style:'cancel'},{text:'Change phase',onPress:()=>{void timer(room.phase === 'FOCUS' ? 'BREAK' : 'FOCUS');}}]); }}>
                    <Text style={styles.controlText}>{room.phase === 'FOCUS' ? '5-min break' : '25-min focus'}</Text>
                  </Pressable>
                </View>
              </View>
            ) : <Text style={styles.description}>Only the host can control the shared timer.</Text>}
            <Pressable accessibilityRole="button" disabled={busy || stale} onPress={() => { void changeStudying(); }}
              style={[styles.studyButton, studying && styles.studyingActive]}>
              <Text style={[styles.studyButtonText, studying && styles.activeText]}>
                {studying ? '✓ I am studying' : 'Mark me as studying'}
              </Text>
            </Pressable>
          </View>
          <RoomMedia key={`media-${room.id}`} roomId={room.id}/>
          <StudyRoomGoal key={room.id} roomId={room.id}/>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Participants · {room.members.length}/12</Text>
            {room.host && <ActionButton secondary title="Regenerate invitation code" disabled={busy || stale} onPress={() => Alert.alert('Replace invitation?', 'The previous code will stop working.', [{ text: 'Cancel' }, { text: 'Replace', onPress: () => { void manageRoom(); } }])}/> }
            {room.members.map(member => (
              <ParticipantCard key={member.userId} name={member.username} host={member.host} online={member.online} studying={member.studying}>
                {room.host && !member.host && <ActionButton secondary title="Make host" disabled={busy || stale} onPress={() => Alert.alert('Transfer host?', `Give controls to ${member.username}?`, [{ text: 'Cancel' }, { text: 'Transfer', onPress: () => { void manageRoom(member.userId); } }])}/>}
              </ParticipantCard>
            ))}
          </View>
          <Text style={styles.footer}>Room state refreshes every 4 seconds using the server clock. Your optional private Goal records eligible group participation.</Text>
          <ActionButton secondary title={room.host ? 'Close room for everyone' : 'Leave room'}
            disabled={busy || stale} onPress={askLeave} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { fontSize: 14, fontWeight: '700', color: '#86efac' },
  heading: { gap: 8 },
  eyebrow: { color: '#75dab0', fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  title: { color: '#fff', fontSize: 34, fontWeight: '900' },
  green: { color: '#75dab0', fontWeight: '800' },
  description: { color: '#9eb0be', fontSize: 14, lineHeight: 21 },
  card: { borderColor: '#2e3c4c', borderWidth: 1, padding: 18, borderRadius: 19, backgroundColor: '#141c22', gap: 13 },
  cardTitle: { color: '#f8fafc', fontSize: 20, fontWeight: '900' },
  input: { borderColor: '#465361', borderWidth: 1, borderRadius: 12, color: '#fff', backgroundColor: '#0b1420', padding: 14, fontSize: 15 },
  codeInput: { fontWeight: '900', letterSpacing: 3 },
  error: { color: '#fda4af', padding: 12, borderColor: '#fda4af55', borderWidth: 1, borderRadius: 12 },
  roomRow: { backgroundColor: '#0a1620', padding: 15, borderRadius: 13, borderColor: '#2c4451', borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 7 },
  roomName: { color: '#fff', fontWeight: '800', fontSize: 15 },
  feature: { borderColor: '#216442', borderWidth: 1, backgroundColor: '#141c22', padding: 19, borderRadius: 24, gap: 17 },
  roomTitle: { color: '#fff', fontSize: 28, fontWeight: '900' },
  inviteBox: { backgroundColor: '#091c15', padding: 16, borderRadius: 14, gap: 7 },
  codeLabel: { color: '#a7c4b1', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  inviteCode: { color: '#a7f3d0', letterSpacing: 3, fontWeight: '900', fontSize: 25 },
  timerBox: { backgroundColor: '#0b1014', borderRadius: 18, paddingVertical: 27, paddingHorizontal: 12, alignItems: 'center', gap: 8 },
  timerLabel: { color: '#a7f3d0', fontSize: 12, letterSpacing: 2, fontWeight: '800' },
  timer: { color: '#fff', fontWeight: '900', fontSize: 60, fontVariant: ['tabular-nums'] },
  controls: { gap: 13 },
  controlRow: { flexWrap: 'wrap', flexDirection: 'row', gap: 8 },
  controlButton: { flex: 1, minWidth: 100, minHeight: 48, backgroundColor: '#26323b', padding: 13, borderRadius: 12, alignItems: 'center' },
  controlText: { color: '#cdf8df', fontSize: 13, fontWeight: '800' },
  studyButton: { borderWidth: 1, borderColor: '#75dab0', padding: 15, borderRadius: 35, alignItems: 'center' },
  studyingActive: { backgroundColor: '#75dab0' },
  studyButtonText: { color: '#a7f3d0', fontWeight: '900', fontSize: 15 },
  activeText: { color: '#08311e' },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  avatar: { borderRadius: 25, backgroundColor: '#1c5137', width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#d1fae5', fontSize: 17, fontWeight: '900' },
  memberName: { color: '#fff', fontWeight: '800', fontSize: 14 },
  footer: { color: '#8197a6', fontSize: 12, lineHeight: 19 },
});
