import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Clock3, Copy, DoorOpen, Headphones, Pause, Play, RefreshCw, RotateCcw, Shield, Users } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getApiErrorMessage } from "../utils/apiError";
import {
    controlStudyRoom, createStudyRoom, displayRoomTime,
    getStudyRoom, heartbeatStudyRoom, joinStudyRoom, leaveStudyRoom,
    listStudyRooms, sharedTimeRemaining
} from "../services/studyRoomService";
import type { StudyRoom, StudyRoomAction } from "../services/studyRoomService";

type Snapshot = { room: StudyRoom; receivedAt: number };

export default function StudyRoomsPage() {
    const { currentUser } = useAuth();
    const [rooms, setRooms] = useState<StudyRoom[]>([]);
    const [roomId, setRoomId] = useState<string | null>(null);
    const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
    const [roomName, setRoomName] = useState("");
    const [invite, setInvite] = useState("");
    const [studying, setStudying] = useState(false);
    const studyingRef = useRef(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [now, setNow] = useState(() => Date.now());
    const refreshing = useRef(false);

    const showRoom = useCallback((room: StudyRoom) => {
        setSnapshot({ room, receivedAt: Date.now() });
        setRoomId(room.id);
        const me = room.members.find(member => member.userId === currentUser?.id);
        const isStudying = me?.studying ?? false;
        studyingRef.current = isStudying;
        setStudying(isStudying);
        setError(null);
    }, [currentUser?.id]);

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
        const timer = window.setInterval(() => setNow(Date.now()), 500);
        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!roomId) return;
        let active = true;
        const refresh = async () => {
            if (!active || refreshing.current || document.visibilityState === "hidden") return;
            refreshing.current = true;
            try {
                const room = await getStudyRoom(roomId);
                if (active) {
                    setSnapshot({ room, receivedAt: Date.now() });
                    setError(null);
                }
            } catch (cause) {
                if (active) setError(getApiErrorMessage(cause, "Unable to sync this room."));
            } finally {
                refreshing.current = false;
            }
        };
        const heartbeat = async () => {
            if (!active || document.visibilityState === "hidden") return;
            try {
                await heartbeatStudyRoom(roomId, studyingRef.current);
            } catch (cause) {
                if (active) setError(getApiErrorMessage(cause, "Could not update your presence."));
            }
        };
        void heartbeat();
        void refresh();
        const poll = window.setInterval(() => void refresh(), 4000);
        const pulse = window.setInterval(() => void heartbeat(), 12000);
        const visible = () => { if (document.visibilityState === "visible") { void heartbeat(); void refresh(); } };
        document.addEventListener("visibilitychange", visible);
        return () => {
            active = false;
            window.clearInterval(poll);
            window.clearInterval(pulse);
            document.removeEventListener("visibilitychange", visible);
        };
    }, [roomId]);

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
            void refreshLobby();
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
            void refreshLobby();
        } catch (cause) {
            setError(getApiErrorMessage(cause, "Invalid or expired invitation code."));
        } finally { setBusy(false); }
    }

    async function control(action: StudyRoomAction) {
        if (!snapshot || !snapshot.room.host || busy) return;
        setBusy(true); setError(null);
        try {
            const room = await controlStudyRoom(snapshot.room.id, action);
            setSnapshot({ room, receivedAt: Date.now() });
        } catch (cause) {
            setError(getApiErrorMessage(cause, "Could not control the timer."));
        } finally { setBusy(false); }
    }

    async function changeStudying() {
        if (!snapshot || busy) return;
        setBusy(true); setError(null);
        try {
            const next = !studyingRef.current;
            const room = await heartbeatStudyRoom(snapshot.room.id, next);
            studyingRef.current = next;
            setStudying(next);
            setSnapshot({ room, receivedAt: Date.now() });
        } catch (cause) {
            setError(getApiErrorMessage(cause, "Could not update study status."));
        } finally { setBusy(false); }
    }

    async function leave() {
        if (!snapshot || busy) return;
        if (snapshot.room.host && !window.confirm("Close this room for everyone?")) return;
        setBusy(true); setError(null);
        try {
            await leaveStudyRoom(snapshot.room.id);
            setSnapshot(null);
            setRoomId(null);
            studyingRef.current = false;
            setStudying(false);
            await refreshLobby();
        } catch (cause) {
            setError(getApiErrorMessage(cause, "Unable to leave the room."));
        } finally { setBusy(false); }
    }

    const room = snapshot?.room;
    const seconds = room && snapshot ? sharedTimeRemaining(room, snapshot.receivedAt, now) : 0;
    const online = room?.members.filter(member => member.online).length ?? 0;
    const studyingCount = room?.members.filter(member => member.studying).length ?? 0;

    return (
        <div className="space-y-7 pb-12">
            <header>
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-emerald-400">
                    <Users size={16} /> STUDY TOGETHER
                </p>
                <h1 className="mt-3 text-4xl font-black tracking-tight text-white">Study Rooms<span className="text-emerald-400">.</span></h1>
                <p className="mt-2 text-sm text-slate-400">Private rooms, a shared focus timer and real-time-ish study presence. Works across Web and Mobile.</p>
            </header>

            {error && <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-950/20 px-4 py-3 text-sm text-rose-300">{error}</div>}

            {!room ? (
                <div className="grid gap-5 lg:grid-cols-2">
                    <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
                        <h2 className="text-xl font-extrabold text-white">Create a private room</h2>
                        <p className="mt-2 text-sm text-slate-400">Invite up to 11 friends with a private code.</p>
                        <label htmlFor="room-name" className="mt-5 block text-xs font-semibold text-slate-300">Room name</label>
                        <input id="room-name" maxLength={60} value={roomName} onChange={event => setRoomName(event.target.value)}
                            placeholder="Late-night calculus" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"/>
                        <button type="button" disabled={busy} onClick={() => void create()}
                            className="mt-4 w-full rounded-full bg-emerald-400 px-5 py-3 font-bold text-slate-950 hover:bg-emerald-300 disabled:opacity-40">Create room</button>
                    </section>
                    <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
                        <h2 className="text-xl font-extrabold text-white">Join your friends</h2>
                        <p className="mt-2 text-sm text-slate-400">Enter the 10-character code shared by the host.</p>
                        <label htmlFor="invite-code" className="mt-5 block text-xs font-semibold text-slate-300">Invitation code</label>
                        <input id="invite-code" maxLength={10} value={invite}
                            onChange={event => setInvite(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g,""))}
                            placeholder="ABCDEFGHIJ" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 font-mono tracking-widest text-white"/>
                        <button type="button" disabled={busy || invite.length !== 10} onClick={() => void join()}
                            className="mt-4 w-full rounded-full border border-emerald-400/60 px-5 py-3 font-bold text-emerald-300 hover:bg-emerald-950/30 disabled:opacity-40">Join room</button>
                    </section>
                    <section className="lg:col-span-2 rounded-3xl border border-white/10 bg-slate-900/70 p-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h2 className="text-xl font-extrabold text-white">Your rooms</h2>
                            <button type="button" onClick={() => void refreshLobby()} className="flex items-center gap-2 text-xs text-emerald-300"><RefreshCw size={15}/> Refresh</button>
                        </div>
                        {loading ? <p className="mt-4 text-slate-400">Loading rooms…</p> : rooms.length === 0 ?
                            <p className="mt-4 text-sm text-slate-400">No rooms yet. Create one or join with a code.</p> :
                            <div className="mt-5 grid gap-3 md:grid-cols-2">
                                {rooms.map(item => (
                                    <button type="button" key={item.id} onClick={() => showRoom(item)}
                                        className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/50 p-4 text-left hover:border-emerald-400/40">
                                        <div><p className="font-semibold text-white">{item.name}</p>
                                            <p className="mt-1 text-xs text-slate-400">{item.members.filter(m=>m.online).length} online · {item.host ? "Your room" : "Friend's room"}</p></div>
                                        <span className="text-emerald-400">Open →</span>
                                    </button>
                                ))}
                            </div>}
                    </section>
                </div>
            ) : (
                <div className="space-y-5">
                    <button type="button" onClick={() => {setSnapshot(null);setRoomId(null);}} className="text-xs font-bold text-emerald-300 hover:underline">← All rooms</button>
                    <div className="rounded-[28px] border border-emerald-400/20 bg-gradient-to-br from-emerald-950/80 via-[#14231f] to-[#111923] p-6 sm:p-9">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <p className="flex items-center gap-2 text-xs font-bold text-emerald-300"><Shield size={15}/> INVITE-ONLY ROOM</p>
                                <h2 className="mt-3 text-3xl font-black text-white">{room.name}</h2>
                                <p className="mt-2 text-sm text-slate-300">{online} online · {studyingCount} studying · {room.members.length}/12 members</p>
                            </div>
                            <div className="rounded-xl border border-emerald-400/30 bg-slate-950/70 p-3">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Private invite code</p>
                                <button type="button" onClick={() => void navigator.clipboard.writeText(room.inviteCode).catch(() => setError("Copy unavailable. Select the code manually."))}
                                    className="mt-1 flex items-center gap-2 font-mono text-lg font-bold tracking-wider text-emerald-300" title="Copy invitation code">
                                    {room.inviteCode} <Copy size={16}/>
                                </button>
                            </div>
                        </div>
                        <div className="mt-8 mx-auto max-w-md rounded-3xl border border-white/10 bg-slate-950/60 px-5 py-8 text-center">
                            <p className="text-xs font-bold uppercase tracking-widest text-emerald-300">{room.phase === "FOCUS" ? "SHARED FOCUS" : "GROUP BREAK"}</p>
                            <p role="timer" className="mt-3 font-mono text-6xl font-black tabular-nums text-white sm:text-7xl">{displayRoomTime(seconds)}</p>
                            <p className="mt-2 text-xs font-semibold text-slate-400">{room.timerStatus === "RUNNING" && seconds === 0 ? "Session finished" : room.timerStatus === "RUNNING" ? "Timer running" : "Waiting for host"}</p>
                            {room.host ? (
                                <div className="mt-6 flex flex-wrap justify-center gap-2">
                                    <button type="button" disabled={busy} onClick={() => void control(room.timerStatus === "RUNNING" && seconds > 0 ? "PAUSE" : "START")}
                                        className="flex items-center gap-2 rounded-full bg-emerald-400 px-5 py-3 font-bold text-slate-950 disabled:opacity-40">
                                        {room.timerStatus === "RUNNING" && seconds > 0 ? <Pause size={18}/> : <Play size={18}/>}
                                        {room.timerStatus === "RUNNING" && seconds > 0 ? "Pause" : "Start"}
                                    </button>
                                    <button type="button" disabled={busy} onClick={() => void control("RESET")}
                                        className="rounded-full border border-white/20 p-3 text-slate-200 disabled:opacity-40" aria-label="Reset timer"><RotateCcw size={19}/></button>
                                    <button type="button" disabled={busy} onClick={() => void control(room.phase === "FOCUS" ? "BREAK" : "FOCUS")}
                                        className="rounded-full border border-white/20 px-4 py-3 text-xs font-semibold text-slate-200 disabled:opacity-40">
                                        {room.phase === "FOCUS" ? "5-min break" : "25-min focus"}
                                    </button>
                                </div>
                            ) : <p className="mt-5 text-sm text-slate-400">Only the host controls the shared clock.</p>}
                        </div>
                        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                            <button type="button" disabled={busy} onClick={() => void changeStudying()}
                                className={`flex items-center gap-2 rounded-full px-5 py-3 text-sm font-extrabold disabled:opacity-40 ${studying ? "bg-emerald-400 text-slate-950" : "border border-emerald-400/50 text-emerald-200"}`}>
                                {studying && <Check size={17}/>} {studying ? "I'm studying" : "Mark me as studying"}
                            </button>
                            <button type="button" disabled={busy} onClick={() => void leave()}
                                className="flex items-center gap-2 rounded-full border border-rose-400/30 px-4 py-3 text-sm text-rose-300 disabled:opacity-40">
                                <DoorOpen size={16}/> {room.host ? "Close room for everyone" : "Leave room"}
                            </button>
                        </div>
                    </div>
                    <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
                        <h3 className="flex items-center gap-2 text-xl font-extrabold text-white"><Users className="text-emerald-400" size={20}/> Studying together</h3>
                        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {room.members.map(member => (
                                <div key={member.userId} className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/60 p-3">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-950 font-black text-emerald-200">{member.username.charAt(0).toUpperCase()}</span>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-bold text-white">{member.username}{member.host ? " · Host" : ""}</p>
                                        <p className={`mt-0.5 text-xs ${member.studying ? "text-emerald-300" : "text-slate-400"}`}>
                                            {member.studying ? "● Studying now" : member.online ? "● Online" : "○ Offline"}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                    <p className="flex items-center gap-2 text-xs text-slate-500"><Clock3 size={15}/> Room time is synchronized to the server and refreshed every 4 seconds. Your personal Pomodoro and saved Goal sessions remain separate.</p>
                    <p className="flex items-center gap-2 text-xs text-slate-500"><Headphones size={15}/> Open Focus Studio separately to listen to study sounds. The shared room does not play or stream music.</p>
                </div>
            )}
        </div>
    );
}
