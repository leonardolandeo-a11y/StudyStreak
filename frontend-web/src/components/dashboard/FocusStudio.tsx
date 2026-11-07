import { getApiErrorMessage } from "../../utils/apiError";
import { studyTracking, recoverTrackedTimer, mergePending, readPending, savePending, removePending } from "../../services/studyTracking";
import { useEffect, useRef, useState } from "react";
import {
    BookOpen, Check, Clock3, Headphones, Music2, Pause, Play,
    RotateCcw, Settings, Sparkles, Volume2, VolumeX
} from "lucide-react";
import { PomodoroAudio } from "./pomodoroAudio";
import FocusInsights from "./FocusInsights";
import { TrackArtwork } from "../focus/TrackArtwork";
import { SoundscapeCarousel } from "../focus/SoundscapeCarousel";
import { FocusDurationDialog } from "../focus/FocusDurationDialog";
import type { FocusSettings } from "../focus/FocusDurationDialog";
import { Link, useSearchParams } from "react-router-dom";
import { getAllActiveGoals } from "../../services/activeGoalsService";
import { recordFocusCompletion } from "../../services/focusSessionService";
import { ROUTES, goalDetailsPath } from "../../routes/paths";
import type { Goal } from "../../types/goal";
import { SOUNDSCAPES, soundscapeById } from "./soundscapes";
import type { SoundCategory } from "./soundscapes";
import {
    advancePomodoro,
    discardPendingFocusSession,
    durationMs,
    formatPomodoroTime,
    newPomodoro,
    pausePomodoro,
    remainingPomodoroMs,
    resetPomodoro,
    restorePomodoro,
    selectPomodoroMode,
    startPomodoro,
    updatePomodoroPreferences
} from "./pomodoroState";
import type {
    CompletedFocusSession, PomodoroMode, PomodoroPreferences,
    PomodoroState, Soundscape
} from "./pomodoroState";

const CIRCUMFERENCE = 2 * Math.PI * 110;

const MODES: { id: PomodoroMode; label: string }[] = [
    { id: "focus", label: "Focus" },
    { id: "shortBreak", label: "Short break" },
    { id: "longBreak", label: "Long break" }
];

const FOCUS_STYLE = {
    accent: "text-accent",
    strong: "bg-accent text-on-accent hover:bg-accent-hover",
    selected: "border-accent bg-accent-soft text-accent",
    outline: "var(--ss-accent)"
};

function readSelectedGoal(key: string): number | null {
    try {
        const raw = window.localStorage.getItem(key);
        const id = raw ? Number(raw) : null;
        return id !== null && Number.isSafeInteger(id) && id > 0 ? id : null;
    } catch {
        return null;
    }
}

function readSavedTimer(key: string): PomodoroState {
    try {
        const saved = window.localStorage.getItem(key);
        return saved ? restorePomodoro(JSON.parse(saved) as unknown, Date.now()) : newPomodoro();
    } catch {
        return newPomodoro();
    }
}

/**
 * The timer and audio live on the dedicated Focus Studio page.
 * Time is wall-clock based and persists locally per user; audio only starts after a click.
 */
export default function FocusStudio({ userId }: { userId: number }) {
    const storageKey = `studystreak:focus-studio:v1:${userId}`;
    const goalKey = `studystreak:focus-studio:goal:v1:${userId}`;
    const [searchParams] = useSearchParams();
    const requestedGoalId = Number(searchParams.get("goalId"));
    const [timer, setTimer] = useState<PomodoroState>(() => readSavedTimer(storageKey));
    const [now, setNow] = useState(() => Date.now());
    const [playing, setPlaying] = useState(false);
    const [audioError, setAudioError] = useState<string | null>(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [soundCategory, setSoundCategory] = useState<SoundCategory | "all">("all");
    const [goals, setGoals] = useState<Goal[]>([]);
    const [goalsLoading, setGoalsLoading] = useState(true);
    const [goalsError, setGoalsError] = useState<string | null>(null);
    const [selectedGoalId, setSelectedGoalId] = useState<number | null>(() =>
        Number.isSafeInteger(requestedGoalId) && requestedGoalId > 0
            ? requestedGoalId : readSelectedGoal(goalKey)
    );
    const [statisticsRevision, setStatisticsRevision] = useState(0);
    const [saveError, setSaveError] = useState<string | null>(null);
    const inFlight = useRef(new Set<string>());
    const failed = useRef(new Set<string>());
    const audio = useRef<PomodoroAudio | null>(null);
    const notifiedAt = useRef<number | null>(timer.lastCompletedAt);

    function getAudio(): PomodoroAudio {
        if (!audio.current) audio.current = new PomodoroAudio();
        return audio.current;
    }

    const previousTracked = useRef<string | null>(null);
    useEffect(() => {
        const retry = setInterval(() => {
            failed.current.clear();
            setTimer(previous => previous.pendingFocusSessions.length ? { ...previous, pendingFocusSessions: [...previous.pendingFocusSessions] } : previous);
        }, 30000);
        return () => clearInterval(retry);
    }, []);
    useEffect(() => {
        const before = previousTracked.current;
        previousTracked.current = timer.activeFocusSession?.sessionId ?? null;
        if (before && before !== previousTracked.current && !timer.pendingFocusSessions.some(item => item.sessionId === before))
            void studyTracking.pulse(before, 'CANCEL').catch(() => setSaveError('Cancellation is pending. Reconnect before starting another recording.'));
    }, [timer.activeFocusSession, timer.pendingFocusSessions]);
    useEffect(() => {
        if (userId == null) return;
        let active = true;
        let recovering = false;
        const recover = async () => {
            if (recovering) return;
            recovering = true;
            try {
                const pending = await readPending(userId);
                const response = await studyTracking.recover();
                if (!active) return;
                failed.current.clear();
                if (response.session) setSelectedGoalId(response.session.goal_id);
                setTimer(previous => recoverTrackedTimer({ ...previous, pendingFocusSessions:
                    mergePending(previous.pendingFocusSessions, pending) }, response.session, response.serverNow));
                setStatisticsRevision(value => value + 1);
            } catch { if (active) setSaveError('Recording recovery unavailable. Pending sessions remain on this device.'); } finally { recovering = false; }
        };
        void recover();
        const recoveryInterval = setInterval(() => { if (document.visibilityState === "visible") void recover(); }, 30000);
        const refresh = () => { if (document.visibilityState === "visible") void recover(); };
        window.addEventListener("online", refresh); window.addEventListener("focus", refresh);
        return () => { active = false; clearInterval(recoveryInterval); window.removeEventListener("online", refresh); window.removeEventListener("focus", refresh); };
    }, [userId]);

    useEffect(() => {
        const session = timer.activeFocusSession;
        if (!session || timer.endsAt === null) return;
        let sending = false;
        const pulse = async () => {
            if (sending || document.visibilityState !== "visible") return;
            sending = true;
            try { await studyTracking.pulse(session.sessionId, 'PULSE'); }
            catch { setSaveError('Recording connection interrupted. Unobserved time will not be credited.'); }
            finally { sending = false; }
        };
        void pulse();
        const interval = setInterval(() => { void pulse(); }, 12000);
        return () => clearInterval(interval);
    }, [timer.activeFocusSession, timer.endsAt]);

    useEffect(() => {
        const controller = new AbortController();
        void getAllActiveGoals(userId, controller.signal).then(result => {
            if (controller.signal.aborted) return;
            setGoals(result);
            setGoalsError(null);
            setSelectedGoalId(previous =>
                previous !== null && result.some(goal => goal.id === previous) ? previous : null
            );
        }).catch(() => {
            if (!controller.signal.aborted) setGoalsError("Could not load your Goals. Try reloading the page.");
        }).finally(() => {
            if (!controller.signal.aborted) setGoalsLoading(false);
        });
        return () => controller.abort();
    }, [userId]);

    useEffect(() => {
        try {
            if (selectedGoalId === null) window.localStorage.removeItem(goalKey);
            else window.localStorage.setItem(goalKey, String(selectedGoalId));
        } catch {
            // Browser privacy settings may prevent persistence.
        }
    }, [goalKey, selectedGoalId]);

    useEffect(() => {
        for (const pending of timer.pendingFocusSessions) {
            if (failed.current.has(pending.sessionId) || inFlight.current.has(pending.sessionId)) {
                continue;
            }
            inFlight.current.add(pending.sessionId);
            void savePending(userId, pending).then(() => recordFocusCompletion(pending)).then(() => removePending(userId, pending.sessionId)).then(() => {
                failed.current.delete(pending.sessionId);
                setTimer(previous => discardPendingFocusSession(previous, pending.sessionId));
                setSaveError(null);
                setStatisticsRevision(value => value + 1);
            }).catch(cause => {
                failed.current.add(pending.sessionId);
                setSaveError(getApiErrorMessage(cause, "Awaiting server confirmation. Pending session retained for retry."));
            }).finally(() => {
                inFlight.current.delete(pending.sessionId);
            });
        }
    }, [timer.pendingFocusSessions, selectedGoalId, userId]);

    useEffect(() => {
        const tick = () => {
            const current = Date.now();
            setNow(current);
            setTimer(previous => advancePomodoro(previous, current));
        };
        const interval = window.setInterval(tick, 500);
        window.addEventListener("focus", tick);
        document.addEventListener("visibilitychange", tick);
        return () => {
            window.clearInterval(interval);
            window.removeEventListener("focus", tick);
            document.removeEventListener("visibilitychange", tick);
        };
    }, []);

    useEffect(() => {
        try {
            window.localStorage.setItem(storageKey, JSON.stringify(timer));
        } catch {
            // The feature continues to work when browser storage is disabled.
        }
    }, [storageKey, timer]);

    useEffect(() => {
        if (timer.lastCompletedAt === null || timer.lastCompletedAt === notifiedAt.current) return;
        notifiedAt.current = timer.lastCompletedAt;
        if (timer.preferences.soundEffects) {
            void getAudio().cue("complete", timer.preferences.volume);
        }
    }, [timer.lastCompletedAt, timer.preferences.soundEffects, timer.preferences.volume]);

    useEffect(() => {
        const previousTitle = document.title;
        return () => {
            document.title = previousTitle;
            audio.current?.dispose();
            audio.current = null;
        };
    }, []);

    const remaining = remainingPomodoroMs(timer, now);
    const chosenGoal = goals.find(goal => goal.id === selectedGoalId);
    const linkedSession = timer.activeFocusSession;
    const goalLocked = linkedSession !== null;
    const pendingSync = timer.pendingFocusSessions.length;
    const total = durationMs(timer.mode, timer.preferences);
    const progress = total > 0 ? Math.min(1, Math.max(0, 1 - remaining / total)) : 0;
    const running = timer.endsAt !== null;
    const style = FOCUS_STYLE;
    const track = soundscapeById(timer.preferences.soundscape);
    const visibleTracks = SOUNDSCAPES.filter(item => soundCategory === "all" || item.category === soundCategory);
    const cycle = timer.focusSessions % 4;
    const remainingLabel = formatPomodoroTime(remaining);

    useEffect(() => {
        document.title = `${remainingLabel} • Focus Studio | StudyStreak`;
    }, [remainingLabel]);

    function changePreferences(changes: Partial<PomodoroPreferences>) {
        setTimer(previous => updatePomodoroPreferences(previous, changes));
    }

    function saveSettings(settings: FocusSettings) {
        setTimer(previous => updatePomodoroPreferences(previous,
            previous.endsAt !== null || previous.activeFocusSession
                ? { soundEffects: settings.soundEffects } : settings));
    }

    async function toggleTimer() {
        const current = Date.now();
        setNow(current);
        // Snapshot goal + duration at session start; switching tabs or pausing never reassigns minutes.
        const completion: CompletedFocusSession | null =
            !running && timer.mode === "focus" && !timer.activeFocusSession && selectedGoalId !== null
                ? {
                    sessionId: crypto.randomUUID(),
                    goalId: selectedGoalId,
                    durationMinutes: timer.preferences.focusMinutes
                }
                : null;
        let recovered: Awaited<ReturnType<typeof studyTracking.recover>> | null = null;
        try {
            if (timer.activeFocusSession) await studyTracking.pulse(timer.activeFocusSession.sessionId, running ? 'PAUSE' : 'RESUME');
            else if (completion) await studyTracking.start(completion);
            if (timer.activeFocusSession || completion) recovered = await studyTracking.recover();
        } catch { setSaveError('Could not start or change server recording. Reopen Focus Studio to recover an active session.'); return; }
        setTimer(previous => {
            const next = running ? pausePomodoro(previous, Date.now()) : startPomodoro(previous, Date.now(), completion);
            return recovered ? recoverTrackedTimer(next, recovered.session, recovered.serverNow) : next;
        });
        if (timer.preferences.soundEffects) {
            void getAudio().cue(running ? "pause" : "start", timer.preferences.volume);
        }
    }

    async function toggleAudio() {
        if (playing) {
            getAudio().stop();
            setPlaying(false);
            return;
        }
        setAudioError(null);
        const started = await getAudio().start(timer.preferences.soundscape, timer.preferences.volume);
        setPlaying(started);
        if (!started) setAudioError("Audio playback is unavailable. Check your browser audio settings.");
    }

    async function chooseTrack(selected: Soundscape) {
        if (selected === timer.preferences.soundscape && playing) {
            getAudio().stop();
            setPlaying(false);
            return;
        }
        changePreferences({ soundscape: selected });
        setAudioError(null);
        // Selecting a track is a direct click, so it can start browser audio.
        const started = await getAudio().start(selected, timer.preferences.volume);
        setPlaying(started);
        if (!started) setAudioError("Audio playback is unavailable. Check your browser audio settings.");
    }

    function retryPending() {
        failed.current.clear();
        setSaveError(null);
        // Give React a fresh queue reference to trigger the sync effect.
        setTimer(previous => ({ ...previous, pendingFocusSessions: [...previous.pendingFocusSessions] }));
    }

    function changeVolume(value: number) {
        changePreferences({ volume: value });
        audio.current?.setVolume(value);
    }

    return (
        <div className="min-w-0 space-y-5 pb-4">
            <header className="flex flex-wrap items-center justify-between gap-4">
                <div><p className="study-kicker flex items-center gap-2"><Headphones size={15} aria-hidden="true"/>Your focus space</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-content">Focus Studio<span className="text-accent">.</span></h1><p className="mt-2 text-sm text-content-muted">One task. Your pace. Your sound.</p></div>
                <Link to={ROUTES.studyRooms} className="study-button">Study together →</Link>
            </header>
                <section aria-label="Pomodoro session timer" className="study-panel min-w-0 p-4 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="flex items-center gap-2 text-sm font-bold text-content">
                                <Clock3 size={19} className={style.accent} aria-hidden="true" /> Your session
                            </p>
                        </div>
                        <span className={`sr-only rounded-full border px-3 py-1.5 text-[11px] font-semibold sm:not-sr-only ${style.selected}`}>
                            {running ? "In progress" : linkedSession ? "Paused" : "Ready to begin"}
                        </span>
                    </div>

                    <div className="mx-auto mt-4 flex max-w-md flex-wrap gap-1 rounded-xl border border-outline bg-canvas p-1" aria-label="Session type">
                        {MODES.map(mode => (
                            <button type="button" key={mode.id} disabled={running}
                                aria-pressed={timer.mode === mode.id}
                                onClick={() => setTimer(previous => selectPomodoroMode(previous, mode.id))}
                                className={`min-h-11 min-w-0 flex-1 rounded-lg border px-2 py-2.5 text-xs font-semibold transition sm:text-sm ${
                                    timer.mode === mode.id ? style.selected : "border-transparent text-content-muted hover:bg-surface-hover hover:text-content"
                                }`}>
                                {mode.label}
                            </button>
                        ))}
                    </div>

                    <div className="relative mx-auto mt-3 aspect-square w-full max-w-[360px]">
                        <svg viewBox="0 0 250 250" aria-hidden="true" className="h-full w-full -rotate-90">
                            <circle cx="125" cy="125" r="110" fill="none" stroke="var(--ss-border-strong)" strokeWidth="8" />
                            <circle cx="125" cy="125" r="110" fill="none" stroke={style.outline} strokeWidth="8" strokeLinecap="round"
                                strokeDasharray={CIRCUMFERENCE} strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
                                className="transition-[stroke-dashoffset] duration-500" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <p className={`text-[11px] font-bold uppercase tracking-[0.28em] ${style.accent}`}>
                                {timer.mode === "focus" ? "DEEP WORK" : "TAKE A BREATH"}
                            </p>
                            <span role="timer" aria-live="off" aria-label={remainingLabel + " remaining"}
                                className="mt-3 font-mono text-6xl font-bold tracking-tight tabular-nums text-content sm:text-7xl">{remainingLabel}</span>
                            <p className="mt-2 text-xs font-medium text-content-muted">{running ? "STAY IN THE FLOW" : "ON YOUR TERMS"}</p>
                        </div>
                    </div>

                    <div className="mx-auto flex max-w-xs items-center justify-center gap-2">
                        <button type="button" onClick={toggleTimer}
                            className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold ${style.strong}`}>
                            {running ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" />}
                            {running ? "Pause timer" : remaining < total ? "Resume session" : timer.mode === "focus" ? "Start focusing" : "Start break"}
                        </button>
                        <button type="button" onClick={() => setTimer(previous => resetPomodoro(previous))}
                            title="Reset current session" aria-label="Reset current session"
                            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-outline-strong bg-canvas text-content-secondary hover:bg-surface-hover">
                            <RotateCcw size={19} aria-hidden="true" />
                        </button>
                        <button type="button" className="study-button size-11 shrink-0 rounded-full p-0" onClick={() => setSettingsOpen(true)}
                            aria-label="Pomodoro settings" title="Pomodoro settings" aria-haspopup="dialog">
                            <Settings size={18} aria-hidden="true" />
                        </button>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-center gap-2" aria-label={`${cycle} of 4 sessions until your next long break`}>
                        {[0, 1, 2, 3].map(index => (
                            <span key={index} className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] ${
                                index < cycle ? style.selected : "border-outline bg-canvas text-content-muted"
                            }`}>
                                {index < cycle ? <Check size={13} aria-hidden="true" /> : index + 1}
                            </span>
                        ))}
                        <span className="ml-2 text-xs text-content-muted">Long break every 4 focus sessions</span>
                    </div>
                </section>
            <div role="group" aria-label="Session tools" className="grid min-w-0 items-stretch gap-4 md:grid-cols-2">
                    <section aria-label="Now playing" className="study-panel min-w-0 p-4 sm:p-5">
                        <div className="mb-3 flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-sm font-semibold text-content"><Music2 size={18} className={style.accent} aria-hidden="true"/>Now playing</h2><span className="text-xs text-content-muted">{playing ? "Playing" : "Paused"}</span></div>
                        <div className="flex items-center gap-3">
                            <TrackArtwork track={timer.preferences.soundscape} compact/>
                            <div className="min-w-0 flex-1"><h3 className="truncate font-semibold text-content">{track.title}</h3><p className="mt-1 truncate text-xs text-content-muted">{track.kind} · StudyStreak Originals</p></div>
                            <button type="button" onClick={() => void toggleAudio()} aria-label={playing ? "Pause soundscape" : "Play soundscape"} className={`flex size-11 shrink-0 items-center justify-center rounded-full ${style.strong}`}>
                                {playing ? <Pause size={20} fill="currentColor" aria-hidden="true"/> : <Play size={20} fill="currentColor" aria-hidden="true"/>}
                            </button>
                        </div>
                        <div className="mt-2 flex items-center gap-3">
                            {timer.preferences.volume === 0 ? <VolumeX size={18} className="shrink-0 text-content-muted" aria-hidden="true"/> : <Volume2 size={18} className="shrink-0 text-content-muted" aria-hidden="true"/>}
                            <input aria-label="Soundscape volume" type="range" min={0} max={100} step={5} value={Math.round(timer.preferences.volume * 100)} onChange={event => changeVolume(Number(event.target.value) / 100)} className="min-h-11 w-full cursor-pointer accent-accent"/>
                            <span className="w-10 text-right text-xs text-content-muted tabular-nums">{Math.round(timer.preferences.volume * 100)}%</span>
                        </div>
                        {audioError && <p role="alert" className="mt-2 text-xs text-danger">{audioError}</p>}
                    </section>
                    <section aria-label="Study goal" className="study-panel min-w-0 p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="flex items-center gap-2 text-sm font-bold text-content">
                                    <BookOpen size={16} className="text-accent" aria-hidden="true" />
                                    Study toward a Goal
                                </p>
                                <p className="mt-1 text-xs text-content-muted">
                                    Only time confirmed by the server is added to your selected Goal.
                                </p>
                            </div>
                            <Link to={ROUTES.goals} className="inline-flex min-h-11 shrink-0 items-center text-xs font-semibold text-accent hover:text-accent-hover">
                                My Goals
                            </Link>
                        </div>
                        <label htmlFor="focus-goal-select" className="mt-3 block text-xs font-semibold text-content-secondary">
                            Link this focus session
                        </label>
                        <select id="focus-goal-select"
                            value={selectedGoalId ?? ""}
                            disabled={goalsLoading || goalLocked}
                            onChange={event => {
                                setSelectedGoalId(event.target.value ? Number(event.target.value) : null);
                            }}
                            className="mt-2 w-full rounded-xl border border-outline-strong bg-canvas px-3 py-3 text-sm text-content">
                            <option value="">No Goal — timer only</option>
                            {goals.map(goal => (
                                <option key={goal.id} value={goal.id}>{goal.topic}</option>
                            ))}
                        </select>
                        {goalsLoading && <p className="mt-2 text-xs text-content-muted">Loading Goals…</p>}
                        {goalsError && <p role="alert" className="mt-2 text-xs text-danger">{goalsError}</p>}
                        {!goalsLoading && !goalsError && goals.length === 0 && (
                            <p className="mt-2 text-xs text-content-muted">No active Goals yet. Create one to track focus time.</p>
                        )}
                        {goalLocked && (
                            <p className="mt-2 text-xs text-accent">
                                This session is linked to its original Goal until you complete or reset it.
                            </p>
                        )}
                        {chosenGoal && <div className="mt-3 space-y-3">
                            <Link className="study-button" to={goalDetailsPath(chosenGoal.id)}>View Goal details</Link>
                        </div>}
                        {!chosenGoal && !goalsLoading && (
                            <p className="mt-2 text-xs text-warning">
                                Pomodoro still works, but unlinked focus time is not recorded.
                            </p>
                        )}
                        {pendingSync > 0 && (
                            <p className="mt-3 text-xs font-semibold text-warning">
                                {pendingSync} completed {pendingSync === 1 ? "session" : "sessions"} waiting to sync.
                            </p>
                        )}
                        {saveError && (
                            <div role="alert" className="mt-3 flex flex-wrap items-center gap-3">
                                <span className="text-xs text-danger">{saveError}</span>
                                <button type="button" onClick={retryPending}
                                    className="rounded-lg border border-amber-500/40 px-3 py-1.5 text-xs text-amber-100 hover:bg-amber-950/40">
                                    Retry sync
                                </button>
                            </div>
                        )}
                    </section>
            </div>
            <p className="flex items-center justify-center gap-2 text-xs text-content-muted"><Sparkles size={14} aria-hidden="true"/>{timer.focusSessions} focus cycles on this device · confirmed totals are in your study statistics</p>
            {settingsOpen && <FocusDurationDialog onClose={() => setSettingsOpen(false)} preferences={timer.preferences}
                locked={running || goalLocked} onSave={saveSettings} />}
            <SoundscapeCarousel tracks={visibleTracks} category={soundCategory} onCategoryChange={setSoundCategory} selected={timer.preferences.soundscape} playing={playing} onChooseTrack={chooseTrack}/>
            <details className="study-panel"><summary className="min-h-11 cursor-pointer py-2 text-lg font-semibold text-content">Explore your study statistics</summary><div className="mt-4"><FocusInsights refreshKey={statisticsRevision}/></div></details>
            <p className="border-t border-outline pt-4 text-xs leading-relaxed text-content-muted">Original audio generated locally. Timer and preferences stay saved in this browser. Only server-confirmed study time appears in your recorded totals.</p>
        </div>
    );
}
