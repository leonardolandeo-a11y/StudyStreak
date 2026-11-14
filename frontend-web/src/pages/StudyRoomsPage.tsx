import '../components/study/study-rooms.css';
import { roomProgress } from '../features/studyRooms/collaborationState';
import { AcademicHeading } from "../components/academic/Academic";
import { TrackingAvatar, TrackingAvatarProvider } from "../components/trackingLinks/TrackingAvatar";
import { RoomProfileLink } from "../components/study/RoomProfileLink";
import { RoomCollaboration } from "../components/study/RoomCollaboration";
import { RoomMedia } from "../components/study/RoomMedia";
import { ParticipantCard } from "../components/study/ParticipantCard";
import StudyRoomGoal from "../components/dashboard/StudyRoomGoal";
import { useCallback, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { Check, Clock3, Copy, DoorOpen, Headphones, Pause, Play, RefreshCw, RotateCcw, Shield, Users } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getApiErrorMessage } from "../utils/apiError";
import {
    controlStudyRoom, createStudyRoom, displayRoomTime,
    getStudyRoom, heartbeatStudyRoom, joinStudyRoom, leaveStudyRoom,
    listStudyRooms, sharedTimeRemaining, regenerateStudyRoomCode, transferStudyRoomHost
} from "../services/studyRoomService";
import type { StudyRoom, StudyRoomAction } from "../services/studyRoomService";

import { isNewerRoom } from "../services/studyRoomClock";

type Snapshot = { room: StudyRoom; receivedAt: number };

export default function StudyRoomsPage() {
    const { currentUser } = useAuth();
    const [moderationTarget, setModerationTarget] = useState<HTMLDivElement | null>(null);
    const [rooms, setRooms] = useState<StudyRoom[]>([]);
    const [roomId, setRoomId] = useState<string | null>(null);
    const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
    const [roomName, setRoomName] = useState("");
    const [invite, setInvite] = useState("");
    const studying = snapshot?.room.members.find(member => member.userId === currentUser?.id)?.studying ?? false;

    const [confirmed, setConfirmed] = useState(false);
    const [, setRefreshingView] = useState(false);
    const [offline, setOffline] = useState(() => !navigator.onLine);
    const [copied, setCopied] = useState(false);
    useEffect(() => {
        const update = () => setOffline(!navigator.onLine);
        window.addEventListener('online', update); window.addEventListener('offline', update);
        return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
    }, []);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [now, setNow] = useState(() => performance.now());


    const showRoom = useCallback((room: StudyRoom) => {
        setConfirmed(false); setCopied(false);
        setSnapshot({ room, receivedAt: performance.now() });
        setRoomId(room.id);
        setError(null);
        window.scrollTo(0, 0);
    }, []);

  const acceptRoom = useCallback((room: StudyRoom) => {
    setConfirmed(true);
    setSnapshot(previous => previous && isNewerRoom(previous.room, room)
      ? { room, receivedAt: performance.now() } : previous);
  }, []);

    const refreshLobby = useCallback(async () => {
        const response = await listStudyRooms();
        setRooms(response);
        setLoading(false);
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        void listStudyRooms(controller.signal).then(result => {
            if (controller.signal.aborted) return;
            setRooms(result);
            setLoading(false);
        }).catch(() => {
            if (!controller.signal.aborted) {
                setError("Unable to load your study rooms.");
                setLoading(false);
            }
        });
        return () => controller.abort();
    }, []);

    useEffect(() => {
        const timer = window.setInterval(() => setNow(performance.now()), 500);
        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!roomId) return;
        let active = true;
        let refreshing = false;
        let pulsing = false;
        const refresh = async () => {
            if (!active || refreshing || document.visibilityState === "hidden") return;
            refreshing = true; setRefreshingView(true);
            try {
                const room = await getStudyRoom(roomId);
                if (active) {
                    acceptRoom(room);
                    setError(null);
                }
            } catch (cause) {
                if (active) {
                    if (isAxiosError(cause) && [403, 404].includes(cause.response?.status ?? 0)) {
                        setSnapshot(null);
                        setRoomId(null);
                        setError("The room was closed or your access changed.");
                        void refreshLobby().catch(() => {});
                    } else {
                        setError(getApiErrorMessage(cause, "Connection interrupted. Retrying automatically…"));
                    }
                }
            } finally {
                refreshing = false; if (active) setRefreshingView(false);
            }
        };
        const heartbeat = async () => {
            if (!active || pulsing || document.visibilityState === "hidden") return;
            pulsing = true;
            try {
                const room = await heartbeatStudyRoom(roomId, null);
                if (active) acceptRoom(room);
            } catch (cause) {
                if (active && !(isAxiosError(cause) && [403, 404].includes(cause.response?.status ?? 0))) {
                    setError(getApiErrorMessage(cause, "Could not update your presence."));
                }
            } finally { pulsing = false; }
        };
        void heartbeat();
        void refresh();
        const poll = window.setInterval(() => void refresh(), 4000);
        const pulse = window.setInterval(() => void heartbeat(), 12000);
        const visible = () => { if (document.visibilityState === "visible") { void heartbeat(); void refresh(); } };
        document.addEventListener("visibilitychange", visible);
        window.addEventListener("online", visible);
        return () => {
            active = false;
            window.clearInterval(poll);
            window.clearInterval(pulse);
            document.removeEventListener("visibilitychange", visible);
            window.removeEventListener("online", visible);
        };
    }, [roomId, refreshLobby, acceptRoom]);

    async function create() {
        if (roomName.trim().length < 3 || roomName.trim().length > 60) {
            setError("Room names must be between 3 and 60 characters.");
            return;
        }
        setBusy(true); setError(null);
        try {
            const room = await createStudyRoom(roomName.trim());
            setRoomName("");
            showRoom(room);
            void refreshLobby().catch(() => {});
        } catch (cause) {
            setError(getApiErrorMessage(cause, "Unable to create the study room."));
        } finally { setBusy(false); }
    }

    async function join() {
        setBusy(true); setError(null);
        try {
            const room = await joinStudyRoom(invite);
            setInvite("");
            showRoom(room);
            void refreshLobby().catch(() => {});
        } catch (cause) {
            setError(getApiErrorMessage(cause, "Invalid or expired invitation code."));
        } finally { setBusy(false); }
    }

    async function control(action: StudyRoomAction) {
        if (!snapshot || !snapshot.room.host || busy || stale) return;
        if (["RESET", "BREAK", "FOCUS"].includes(action) && !window.confirm("Change the shared timer? Open participation in this round will be cancelled.")) return;
        setBusy(true); setError(null);
        try {
            const room = await controlStudyRoom(snapshot.room.id, action, snapshot.room.version);
            acceptRoom(room);
        } catch (cause) {
            setError(getApiErrorMessage(cause, "Could not control the timer."));
        } finally { setBusy(false); }
    }

    async function changeStudying() {
        if (!snapshot || busy || stale) return;
        setBusy(true); setError(null);
        try {
            const next = !studying;
            const room = await heartbeatStudyRoom(snapshot.room.id, next);
            acceptRoom(room);
        } catch (cause) {
            setError(getApiErrorMessage(cause, "Could not update study status."));
        } finally { setBusy(false); }
    }

  async function manageRoom(userId?: number) {
    if (!snapshot?.room.host || busy || stale) return;
    setBusy(true);
    try {
      const updated = userId === undefined
        ? await regenerateStudyRoomCode(snapshot.room.id)
        : await transferStudyRoomHost(snapshot.room.id, userId);
      acceptRoom(updated);
      setError(null);
    } catch (cause) {
      setError(getApiErrorMessage(cause, 'Room changed or connection interrupted. Please retry.'));
    } finally { setBusy(false); }
  }

    async function leave() {
        if (!snapshot || busy || stale) return;
        if (snapshot.room.host && !window.confirm("Close this room for everyone?")) return;
        setBusy(true); setError(null);
        try {
            await leaveStudyRoom(snapshot.room.id);
            setSnapshot(null);
            setRoomId(null);
            await refreshLobby();
        } catch (cause) {
            setError(getApiErrorMessage(cause, "Unable to leave the room."));
        } finally { setBusy(false); }
    }

  const stale = snapshot !== null && (!confirmed || offline || now - snapshot.receivedAt > 15_000);
  const room = snapshot?.room;
    const seconds = room && snapshot ? sharedTimeRemaining(room, snapshot.receivedAt, now) : 0;
    const online = room?.members.filter(member => member.online).length ?? 0;
    const studyingCount = room?.members.filter(member => member.online && member.studying).length ?? 0;

    return (
        <TrackingAvatarProvider revision={0}><div className="academic-page academic-module cozy-rooms space-y-6 pb-12">
            {!room && <AcademicHeading title="Study Rooms" eyebrow="Study together" glyph="clock" description="A shared clock. A little accountability. A private place to make progress together." />}

            {room && (offline || busy || error || stale) && <p role="status" className="room-connection">{offline ? "Offline · controls unavailable" : busy ? "Action pending · waiting for server" : error ? "Connection or action needs attention · see details below" : "Reconnecting · waiting for a fresh room state"}</p>}
            {error && <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-950/20 px-4 py-3 text-sm text-rose-300">{error}</div>}

            {!room ? (
                <div className="grid gap-5 lg:grid-cols-2">
                    <section className="study-panel">
                        <h2 className="text-xl font-extrabold text-content">Create a private room</h2>
                        <p className="mt-2 text-sm text-slate-400">Invite up to 11 friends with a private code.</p>
                        <label htmlFor="room-name" className="mt-5 block text-xs font-semibold text-slate-300">Room name</label>
                        <input id="room-name" maxLength={60} value={roomName} onChange={event => setRoomName(event.target.value)}
                            placeholder="Late-night calculus" className="mt-2 w-full rounded-xl border border-outline-strong bg-slate-950 px-4 py-3 text-content"/>
                        <button type="button" disabled={busy || stale} onClick={() => void create()}
                            className="mt-4 w-full rounded-full bg-accent px-5 py-3 font-bold text-on-accent hover:bg-accent-hover disabled:opacity-40">Create room</button>
                    </section>
                    <section className="study-panel">
                        <h2 className="text-xl font-extrabold text-content">Join your friends</h2>
                        <p className="mt-2 text-sm text-slate-400">Enter the 10-character code shared by the host.</p>
                        <label htmlFor="invite-code" className="mt-5 block text-xs font-semibold text-slate-300">Invitation code</label>
                        <input id="invite-code" maxLength={10} value={invite}
                            onChange={event => setInvite(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g,""))}
                            placeholder="ABCDEFGHIJ" className="mt-2 w-full rounded-xl border border-outline-strong bg-slate-950 px-4 py-3 font-mono tracking-widest text-content"/>
                        <button type="button" disabled={busy || invite.length !== 10} onClick={() => void join()}
                            className="mt-4 w-full rounded-full border border-accent px-5 py-3 font-bold text-accent hover:bg-accent-soft disabled:opacity-40">Join room</button>
                    </section>
                    <section className="study-panel lg:col-span-2">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h2 className="text-xl font-extrabold text-content">Your rooms <span className="text-sm font-normal text-slate-400">{rooms.length}</span></h2>
                            <button type="button" onClick={() => void refreshLobby().catch(() => setError("Unable to load rooms."))} className="flex items-center gap-2 text-xs text-accent"><RefreshCw size={15}/> Refresh</button>
                        </div>
                        {loading ? <p className="mt-4 text-slate-400">Loading rooms…</p> : rooms.length === 0 ?
                            <p className="mt-4 text-sm text-slate-400">No rooms yet. Create one or join with a code.</p> :
                            <div className="mt-5 grid gap-3 md:grid-cols-2">
                                {rooms.map(item => (
                                    <button type="button" key={item.id} onClick={() => showRoom(item)}
                                        className="flex items-center justify-between gap-3 rounded-xl border border-outline-strong bg-surface-raised p-4 text-left hover:border-accent">
                                        <div className="min-w-0"><p className="break-words text-lg font-semibold text-content">{item.name}</p>
                                            <p className="mt-1 text-xs text-slate-400">{item.members.length}/12 members · {item.members.filter(m=>m.online).length} online</p><p className="mt-2 text-xs text-slate-400">Host: {item.members.find(m=>m.host)?.username ?? "—"} · {item.phase} / {item.timerStatus}</p></div>
                                        <span className="shrink-0 text-sm text-accent">Open →</span>
                                    </button>
                                ))}
                            </div>}
                    </section>
                </div>
            ) : (
                <div className="room-workspace">
                    <button type="button" onClick={() => {setSnapshot(null);setRoomId(null);}} className="room-back">← All rooms</button>
                    <header className="study-panel room-header"><div><p className="room-eyebrow"><Shield size={14}/> INVITE-ONLY ROOM</p><h1>{room.name}</h1><p>{online} connected · {studyingCount} studying · {room.members.length}/12 members</p></div>
                        <button type="button" className="study-button room-invite" aria-label="Copy invitation code" onClick={() => void navigator.clipboard.writeText(room.inviteCode).then(() => setCopied(true)).catch(() => setError("Copy unavailable. Select the code manually."))}><Copy size={16}/><span>{room.inviteCode}</span><span role="status">{copied ? 'Copied' : 'Copy'}</span></button>
                    </header>
                    <div className="room-layout"><div className="room-main">
                        <RoomMedia key={`media-${room.id}`} room={room} moderationTarget={moderationTarget}/>
                        <section className="study-panel room-timer" aria-label="Shared Pomodoro">
                            <div className="room-dial">
                                <svg viewBox="0 0 250 250" aria-hidden="true"><circle cx="125" cy="125" r="116" className="room-dial-track"/><circle cx="125" cy="125" r="116" className="room-dial-progress" strokeDasharray={2*Math.PI*116} strokeDashoffset={2*Math.PI*116*(1-roomProgress(seconds,room.phase))}/></svg>
                                <div><p className="room-eyebrow">{room.phase === 'FOCUS' ? 'SHARED FOCUS' : 'GROUP BREAK'}</p><p role="timer" className="room-time">{displayRoomTime(seconds)}</p><p className="room-timer-status">{stale ? 'Last known timer · reconnecting' : room.timerStatus === 'PAUSED' ? 'Timer paused' : room.timerStatus === 'COMPLETE' ? 'Session finished · server confirmed' : room.timerStatus === 'RUNNING' && seconds === 0 ? 'Awaiting server confirmation' : room.timerStatus === 'RUNNING' ? 'Timer running' : 'Waiting for host'}</p></div>
                            </div>
                            {room.host ? <div className="room-host-controls" aria-label="Host controls">
                                <button type="button" className="study-button room-primary" disabled={busy || stale} onClick={() => void control(room.timerStatus === 'RUNNING' && seconds > 0 ? 'PAUSE' : 'START')}>{room.timerStatus === 'RUNNING' && seconds > 0 ? <Pause size={17}/> : <Play size={17}/>} {room.timerStatus === 'RUNNING' && seconds > 0 ? 'Pause' : 'Start'}</button>
                                <button type="button" className="study-button" aria-label="Reset timer" disabled={busy || stale} onClick={() => void control('RESET')}><RotateCcw size={17}/></button>
                                <button type="button" className="study-button" disabled={busy || stale} onClick={() => void control(room.phase === 'FOCUS' ? 'BREAK' : 'FOCUS')}>{room.phase === 'FOCUS' ? '5-min break' : '25-min focus'}</button>
                            </div> : <p className="room-chat-notice">Only the host controls the shared clock.</p>}
                            <div className="room-session-actions"><button type="button" className="study-button" aria-pressed={studying} disabled={busy || stale} onClick={() => void changeStudying()}>{studying && <Check size={16}/>} {studying ? "I'm studying" : 'Mark me as studying'}</button><button type="button" className="study-button room-danger" disabled={busy || stale} onClick={() => void leave()}><DoorOpen size={16}/>{room.host ? 'Close room for everyone' : 'Leave room'}</button></div>
                        </section>
                        <StudyRoomGoal key={room.id} roomId={room.id}/>
                    </div><RoomCollaboration key={`chat-${room.id}`} room={room} userId={currentUser?.id}>
                    <section className="room-participant-list">
                        {room.host && <button type="button" disabled={busy || stale} onClick={() => { if (window.confirm("Replace the invitation code? The previous code will stop working.")) void manageRoom(); }} className="mb-4 text-sm text-accent">Regenerate invitation code</button>}
                        <h3 className="flex items-center gap-2 text-xl font-extrabold text-content"><Users className="text-accent" size={20}/> Studying together</h3>
                        <div className="mt-3 grid gap-2">
                            {room.members.map(member => (
                                <ParticipantCard avatar={<TrackingAvatar id={member.userId} name={member.username} className="size-11 text-lg" />} key={member.userId} name={member.username} host={member.host} online={member.online} studying={member.studying}>
                                    <RoomProfileLink id={member.userId} name={member.username} />
                                    {room.host && !member.host && <button type="button" disabled={busy || stale} className="study-button mt-3" onClick={() => { if (window.confirm(`Transfer host controls to ${member.username}?`)) void manageRoom(member.userId); }}>Make host</button>}
                                </ParticipantCard>
                            ))}
                        </div>
                    </section>
                    <div ref={setModerationTarget}/>
                    </RoomCollaboration></div>
                    <p className="flex items-center gap-2 text-xs text-slate-500"><Clock3 size={15}/> Room time is synchronized to the server and refreshed every 4 seconds. Choose your private Goal above to record eligible group participation.</p>
                    <p className="flex items-center gap-2 text-xs text-slate-500"><Headphones size={15}/> Open Focus Studio separately to listen to study sounds. The shared room does not play or stream music.</p>
                </div>
            )}
        </div></TrackingAvatarProvider>
    );
}
