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
    const [rooms, setRooms] = useState<StudyRoom[]>([]);
    const [roomId, setRoomId] = useState<string | null>(null);
    const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
    const [roomName, setRoomName] = useState("");
    const [invite, setInvite] = useState("");
    const studying = snapshot?.room.members.find(member => member.userId === currentUser?.id)?.studying ?? false;

    const [confirmed, setConfirmed] = useState(false);
    const [refreshingView, setRefreshingView] = useState(false);
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
        <div className="space-y-7 pb-12">
            <header>
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-emerald-400">
                    <Users size={16} /> STUDY TOGETHER
                </p>
                <h1 className="mt-3 text-4xl font-black tracking-tight text-white">Study Rooms<span className="text-emerald-400">.</span></h1>
                <p className="mt-2 text-sm text-slate-400">A shared clock. A little accountability. A private place to make progress together.</p>
            </header>

            {room && <p role="status" className="inline-flex rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300">{offline ? "Offline · controls unavailable" : busy ? "Action pending · waiting for server" : error ? "Connection or action needs attention · see details below" : stale ? "Reconnecting · waiting for a fresh room state" : refreshingView ? "Updating room…" : "Synced · server confirmed"}</p>}
            {error && <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-950/20 px-4 py-3 text-sm text-rose-300">{error}</div>}

            {!room ? (
                <div className="grid gap-5 lg:grid-cols-2">
                    <section className="study-panel">
                        <h2 className="text-xl font-extrabold text-white">Create a private room</h2>
                        <p className="mt-2 text-sm text-slate-400">Invite up to 11 friends with a private code.</p>
                        <label htmlFor="room-name" className="mt-5 block text-xs font-semibold text-slate-300">Room name</label>
                        <input id="room-name" maxLength={60} value={roomName} onChange={event => setRoomName(event.target.value)}
                            placeholder="Late-night calculus" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"/>
                        <button type="button" disabled={busy || stale} onClick={() => void create()}
                            className="mt-4 w-full rounded-full bg-emerald-400 px-5 py-3 font-bold text-slate-950 hover:bg-emerald-300 disabled:opacity-40">Create room</button>
                    </section>
                    <section className="study-panel">
                        <h2 className="text-xl font-extrabold text-white">Join your friends</h2>
                        <p className="mt-2 text-sm text-slate-400">Enter the 10-character code shared by the host.</p>
                        <label htmlFor="invite-code" className="mt-5 block text-xs font-semibold text-slate-300">Invitation code</label>
                        <input id="invite-code" maxLength={10} value={invite}
                            onChange={event => setInvite(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g,""))}
                            placeholder="ABCDEFGHIJ" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 font-mono tracking-widest text-white"/>
                        <button type="button" disabled={busy || invite.length !== 10} onClick={() => void join()}
                            className="mt-4 w-full rounded-full border border-emerald-400/60 px-5 py-3 font-bold text-emerald-300 hover:bg-emerald-950/30 disabled:opacity-40">Join room</button>
                    </section>
                    <section className="study-panel lg:col-span-2">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h2 className="text-xl font-extrabold text-white">Your rooms <span className="text-sm font-normal text-slate-400">{rooms.length}</span></h2>
                            <button type="button" onClick={() => void refreshLobby().catch(() => setError("Unable to load rooms."))} className="flex items-center gap-2 text-xs text-emerald-300"><RefreshCw size={15}/> Refresh</button>
                        </div>
                        {loading ? <p className="mt-4 text-slate-400">Loading rooms…</p> : rooms.length === 0 ?
                            <p className="mt-4 text-sm text-slate-400">No rooms yet. Create one or join with a code.</p> :
                            <div className="mt-5 grid gap-3 md:grid-cols-2">
                                {rooms.map(item => (
                                    <button type="button" key={item.id} onClick={() => showRoom(item)}
                                        className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/50 p-4 text-left hover:border-emerald-400/40">
                                        <div className="min-w-0"><p className="break-words text-lg font-semibold text-white">{item.name}</p>
                                            <p className="mt-1 text-xs text-slate-400">{item.members.length}/12 members · {item.members.filter(m=>m.online).length} online</p><p className="mt-2 text-xs text-slate-400">Host: {item.members.find(m=>m.host)?.username ?? "—"} · {item.phase} / {item.timerStatus}</p></div>
                                        <span className="shrink-0 text-sm text-emerald-200">Open →</span>
                                    </button>
                                ))}
                            </div>}
                    </section>
                </div>
            ) : (
                <div className="space-y-5">
                    <button type="button" onClick={() => {setSnapshot(null);setRoomId(null);}} className="text-xs font-bold text-emerald-300 hover:underline">← All rooms</button>
                    <div className="study-panel border-t-2 border-t-emerald-400">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <p className="flex items-center gap-2 text-xs font-bold text-emerald-300"><Shield size={15}/> INVITE-ONLY ROOM</p>
                                <h2 className="mt-3 break-words text-3xl font-semibold text-white">{room.name}</h2>
                                <p className="mt-2 text-sm text-slate-300">{online} online · {studyingCount} studying · {room.members.length}/12 members</p>
                            </div>
                            <div className="rounded-xl border border-emerald-400/30 bg-slate-950/70 p-3">
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Private invite code</p>
                                <button type="button" onClick={() => void navigator.clipboard.writeText(room.inviteCode).then(() => setCopied(true)).catch(() => setError("Copy unavailable. Select the code manually."))}
                                    className="mt-1 flex items-center gap-2 font-mono text-lg font-bold tracking-wider text-emerald-300" title="Copy invitation code">
                                    {room.inviteCode} <Copy size={16}/> <span className="text-xs font-sans tracking-normal" role="status">{copied ? "Copied" : "Copy"}</span>
                                </button>
                            </div>
                        </div>
                        <div className="mt-8 mx-auto max-w-2xl rounded-2xl bg-slate-950 px-4 py-10 text-center">
                            <p className="text-xs font-bold uppercase tracking-widest text-emerald-300">{room.phase === "FOCUS" ? "SHARED FOCUS" : "GROUP BREAK"}</p>
                            <p role="timer" className="mt-4 font-mono text-[clamp(3.5rem,12vw,7rem)] font-semibold leading-none tracking-tight tabular-nums text-white">{displayRoomTime(seconds)}</p>
                            <p className="mt-2 text-xs font-semibold text-slate-400">{stale ? "Last known timer · reconnecting" : room.timerStatus === "PAUSED" ? "Timer paused" : room.timerStatus === "COMPLETE" ? "Session finished · server confirmed" : (room.timerStatus === "RUNNING" && seconds === 0) ? "Awaiting server confirmation" : room.timerStatus === "RUNNING" ? "Timer running" : "Waiting for host"}</p>
                            {room.host ? (
                                <div className="mt-6 flex flex-wrap justify-center gap-2"><p className="w-full text-xs uppercase tracking-widest text-slate-400">Host controls</p>
                                    <button type="button" disabled={busy || stale} onClick={() => void control(room.timerStatus === "RUNNING" && seconds > 0 ? "PAUSE" : "START")}
                                        className="flex items-center gap-2 rounded-full bg-emerald-400 px-5 py-3 font-bold text-slate-950 disabled:opacity-40">
                                        {room.timerStatus === "RUNNING" && seconds > 0 ? <Pause size={18}/> : <Play size={18}/>}
                                        {room.timerStatus === "RUNNING" && seconds > 0 ? "Pause" : "Start"}
                                    </button>
                                    <button type="button" disabled={busy || stale} onClick={() => void control("RESET")}
                                        className="rounded-full border border-white/20 p-3 text-slate-200 disabled:opacity-40" aria-label="Reset timer"><RotateCcw size={19}/></button>
                                    <button type="button" disabled={busy || stale} onClick={() => void control(room.phase === "FOCUS" ? "BREAK" : "FOCUS")}
                                        className="rounded-full border border-white/20 px-4 py-3 text-xs font-semibold text-slate-200 disabled:opacity-40">
                                        {room.phase === "FOCUS" ? "5-min break" : "25-min focus"}
                                    </button>
                                </div>
                            ) : <p className="mt-5 text-sm text-slate-400">Only the host controls the shared clock.</p>}
                        </div>
                        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                            <button type="button" disabled={busy || stale} onClick={() => void changeStudying()}
                                className={`flex items-center gap-2 rounded-full px-5 py-3 text-sm font-extrabold disabled:opacity-40 ${studying ? "bg-emerald-400 text-slate-950" : "border border-emerald-400/50 text-emerald-200"}`}>
                                {studying && <Check size={17}/>} {studying ? "I'm studying" : "Mark me as studying"}
                            </button>
                            <button type="button" disabled={busy || stale} onClick={() => void leave()}
                                className="flex items-center gap-2 rounded-full border border-rose-400/30 px-4 py-3 text-sm text-rose-300 disabled:opacity-40">
                                <DoorOpen size={16}/> {room.host ? "Close room for everyone" : "Leave room"}
                            </button>
                        </div>
                    </div>
                    <StudyRoomGoal key={room.id} roomId={room.id}/>
                    <section className="study-panel">
                        {room.host && <button type="button" disabled={busy || stale} onClick={() => { if (window.confirm("Replace the invitation code? The previous code will stop working.")) void manageRoom(); }} className="mb-4 text-sm text-emerald-300">Regenerate invitation code</button>}
                        <h3 className="flex items-center gap-2 text-xl font-extrabold text-white"><Users className="text-emerald-400" size={20}/> Studying together</h3>
                        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {room.members.map(member => (
                                <ParticipantCard key={member.userId} name={member.username} host={member.host} online={member.online} studying={member.studying}>
                                    {room.host && !member.host && <button type="button" disabled={busy || stale} className="study-button mt-3" onClick={() => { if (window.confirm(`Transfer host controls to ${member.username}?`)) void manageRoom(member.userId); }}>Make host</button>}
                                </ParticipantCard>
                            ))}
                        </div>
                    </section>
                    <p className="flex items-center gap-2 text-xs text-slate-500"><Clock3 size={15}/> Room time is synchronized to the server and refreshed every 4 seconds. Choose your private Goal above to record eligible group participation.</p>
                    <p className="flex items-center gap-2 text-xs text-slate-500"><Headphones size={15}/> Open Focus Studio separately to listen to study sounds. The shared room does not play or stream music.</p>
                </div>
            )}
        </div>
    );
}
