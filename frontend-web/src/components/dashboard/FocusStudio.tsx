import { useEffect, useRef, useState } from "react";
import {
    AudioLines, BookOpen, Check, ChevronDown, Clock3, CloudRain, Coffee, Disc3,
    Flame, Headphones, MoonStar, Music2, Pause, Piano, Play,
    Radio, RotateCcw, Settings2, Sparkles, Trees, Volume2,
    VolumeX, Waves
} from "lucide-react";
import { PomodoroAudio } from "./pomodoroAudio";
import FocusInsights from "./FocusInsights";
import { Link, useSearchParams } from "react-router-dom";
import { getAllActiveGoals } from "../../services/activeGoalsService";
import { getFocusSummary, recordFocusCompletion } from "../../services/focusSessionService";
import type { FocusSummary } from "../../services/focusSessionService";
import { ROUTES, goalDetailsPath } from "../../routes/paths";
import type { Goal } from "../../types/goal";
import { SOUNDSCAPES, SOUND_CATEGORIES, soundscapeById } from "./soundscapes";
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
    CompletedFocusSession, FocusTheme, PomodoroMode, PomodoroPreferences,
    PomodoroState, Soundscape
} from "./pomodoroState";

const CIRCUMFERENCE = 2 * Math.PI * 110;

const MODES: { id: PomodoroMode; label: string }[] = [
    { id: "focus", label: "Focus" },
    { id: "shortBreak", label: "Short break" },
    { id: "longBreak", label: "Long break" }
];

const THEMES: Record<FocusTheme, {
    label: string;
    background: string;
    tint: string;
    accent: string;
    strong: string;
    selected: string;
    outline: string;
    swatch: string;
}> = {
    aurora: {
        label: "Aurora",
        background: "from-emerald-950 via-[#13241f] to-[#111a1a]",
        tint: "bg-emerald-400/15",
        accent: "text-emerald-300",
        strong: "bg-emerald-400 text-slate-950 hover:bg-emerald-300",
        selected: "border-emerald-400/50 bg-emerald-400/10 text-emerald-200",
        outline: "#34d399",
        swatch: "bg-emerald-400"
    },
    sunset: {
        label: "Sunset",
        background: "from-rose-950 via-[#2d1b28] to-[#15151e]",
        tint: "bg-rose-400/15",
        accent: "text-rose-300",
        strong: "bg-rose-300 text-slate-950 hover:bg-rose-200",
        selected: "border-rose-400/50 bg-rose-400/10 text-rose-200",
        outline: "#fda4af",
        swatch: "bg-rose-300"
    },
    ocean: {
        label: "Ocean",
        background: "from-blue-950 via-[#14243d] to-[#101923]",
        tint: "bg-sky-400/15",
        accent: "text-sky-300",
        strong: "bg-sky-300 text-slate-950 hover:bg-sky-200",
        selected: "border-sky-400/50 bg-sky-400/10 text-sky-200",
        outline: "#7dd3fc",
        swatch: "bg-sky-300"
    }
};

const TRACK_ICONS: Record<Soundscape, typeof MoonStar> = {
    dream: MoonStar,
    keys: Piano,
    classical: Music2,
    lofi: Disc3,
    white: Radio,
    pink: AudioLines,
    brown: Waves,
    rain: CloudRain,
    forest: Trees,
    ocean: Waves,
    cafe: Coffee,
    fireplace: Flame
};

type DurationField = "focusMinutes" | "shortBreakMinutes" | "longBreakMinutes";

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

function TrackArtwork({ track, compact = false }: {
    track: Soundscape;
    compact?: boolean;
}) {
    const color = soundscapeById(track).gradient;
    const Icon = TRACK_ICONS[track];

    return (
        <div className={`relative isolate flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br ${color} ${compact ? "h-14 w-14 rounded-lg" : "aspect-square w-full rounded-2xl"}`}>
            <div aria-hidden="true" className="absolute -right-1/4 -top-1/4 h-3/4 w-3/4 rounded-full bg-white/10 blur-2xl" />
            <div aria-hidden="true" className={`absolute rounded-full border border-white/20 bg-slate-950/25 shadow-2xl shadow-black/30 ${compact ? "h-11 w-11" : "h-[70%] w-[70%]"}`}>
                <div className="absolute inset-[13%] rounded-full border border-white/15" />
                <div className="absolute inset-[27%] rounded-full border border-white/10" />
                <div className="absolute inset-[42%] rounded-full border border-white/20 bg-white/15" />
            </div>
            <Icon aria-hidden="true" className={`relative drop-shadow-lg ${compact ? "h-5 w-5" : "h-16 w-16 sm:h-20 sm:w-20"}`} strokeWidth={1.25} />
            {!compact && <span className="absolute bottom-4 left-5 text-[10px] font-bold uppercase tracking-[0.28em] text-white/60">STUDYSTREAK ORIGINALS</span>}
        </div>
    );
}

function DurationInput({ label, value, min, max, disabled, onChange }: {
    label: string;
    value: number;
    min: number;
    max: number;
    disabled: boolean;
    onChange: (value: number) => void;
}) {
    return (
        <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-3">
            <span className="text-xs font-medium text-slate-300">{label}</span>
            <span className="flex items-center gap-1.5">
                <input
                    type="number"
                    inputMode="numeric"
                    aria-label={label + " minutes"}
                    min={min}
                    max={max}
                    step={1}
                    disabled={disabled}
                    value={value}
                    onChange={event => {
                        if (event.target.value !== "") onChange(Number(event.target.value));
                    }}
                    className="w-16 rounded-md border border-white/15 bg-slate-950 px-2 py-1 text-center text-sm font-semibold text-white"
                />
                <span className="text-xs text-slate-500">min</span>
            </span>
        </label>
    );
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
    const [goalSummary, setGoalSummary] = useState<FocusSummary | null>(null);
    const [summaryRevision, setSummaryRevision] = useState(0);
    const [statisticsRevision, setStatisticsRevision] = useState(0);
    const [summaryError, setSummaryError] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const inFlight = useRef(new Set<string>());
    const failed = useRef(new Set<string>());
    const audio = useRef<PomodoroAudio | null>(null);
    const notifiedAt = useRef<number | null>(timer.lastCompletedAt);

    function getAudio(): PomodoroAudio {
        if (!audio.current) audio.current = new PomodoroAudio();
        return audio.current;
    }

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
        if (selectedGoalId === null) return;
        const controller = new AbortController();
        void getFocusSummary(selectedGoalId, controller.signal).then(summary => {
            if (!controller.signal.aborted) {
                setGoalSummary(summary);
                setSummaryError(false);
            }
        }).catch(() => {
            if (!controller.signal.aborted) setSummaryError(true);
        });
        const reloadVisible = () => {
            if (document.visibilityState === "visible") setSummaryRevision(value => value + 1);
        };
        window.addEventListener("focus", reloadVisible);
        document.addEventListener("visibilitychange", reloadVisible);
        return () => {
            controller.abort();
            window.removeEventListener("focus", reloadVisible);
            document.removeEventListener("visibilitychange", reloadVisible);
        };
    }, [selectedGoalId, summaryRevision]);

    useEffect(() => {
        for (const pending of timer.pendingFocusSessions) {
            if (failed.current.has(pending.sessionId) || inFlight.current.has(pending.sessionId)) {
                continue;
            }
            inFlight.current.add(pending.sessionId);
            void recordFocusCompletion(pending).then(() => {
                failed.current.delete(pending.sessionId);
                setTimer(previous => discardPendingFocusSession(previous, pending.sessionId));
                setSaveError(null);
                setSummaryRevision(value => value + 1);
                setStatisticsRevision(value => value + 1);
            }).catch(() => {
                failed.current.add(pending.sessionId);
                setSaveError("A completed session is pending sync. Retry when the server is available.");
            }).finally(() => {
                inFlight.current.delete(pending.sessionId);
            });
        }
    }, [timer.pendingFocusSessions, selectedGoalId]);

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
    const style = THEMES[timer.preferences.theme];
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

    function changeDuration(field: DurationField, value: number) {
        if (running) return;
        changePreferences({ [field]: value });
    }

    function toggleTimer() {
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
        setTimer(previous => running ? pausePomodoro(previous, current)
            : startPomodoro(previous, current, completion));
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
        <div className="space-y-7 pb-6">
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-emerald-400">
                        <Headphones size={15} aria-hidden="true" /> Your personal listening room
                    </p>
                    <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">Focus Studio<span className="text-emerald-400">.</span></h1>
                    <p className="mt-3 max-w-2xl text-sm text-slate-400 sm:text-base">Your pace, your sound. Explore instrumental music, color noise and soothing spaces alongside your Pomodoro timer.</p>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300">
                    <Sparkles size={15} className="text-emerald-400" aria-hidden="true" />
                    {timer.focusSessions} completed {timer.focusSessions === 1 ? "session" : "sessions"}
                </div>
            </header>

            <section aria-label="Featured focus mix" className={`relative isolate overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br ${style.background} p-5 sm:p-8`}>
                <div aria-hidden="true" className={`pointer-events-none absolute -right-20 -top-32 h-96 w-96 rounded-full blur-[80px] ${style.tint}`} />
                <div className="relative grid items-center gap-6 sm:grid-cols-[190px_minmax(0,1fr)] lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-10">
                    <TrackArtwork track={timer.preferences.soundscape} />
                    <div className="min-w-0">
                        <p className={`flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] ${style.accent}`}>
                            <Disc3 size={16} aria-hidden="true" /> YOUR FOCUS MIX
                        </p>
                        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">Get in the zone.</h2>
                        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-200/80">Less noise. More momentum. Put on a soundscape, choose a session, and make some space for the work that matters.</p>
                        <div className="mt-5 flex flex-wrap items-center gap-3">
                            <button type="button" onClick={() => void toggleAudio()}
                                aria-label={playing ? "Pause ambient audio" : "Play ambient audio"}
                                className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold shadow-lg shadow-black/20 ${style.strong}`}>
                                {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                                {playing ? "Pause mix" : "Play mix"}
                            </button>
                            <span className="text-sm text-slate-300">{track.title} <span className="mx-1 text-slate-500">·</span> {track.kind}</span>
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(350px,0.9fr)]">
                <section aria-label="Pomodoro session timer" className="rounded-[26px] border border-white/10 bg-[#111820] p-5 sm:p-7">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="flex items-center gap-2 text-sm font-bold text-white">
                                <Clock3 size={19} className={style.accent} aria-hidden="true" /> Your session
                            </p>
                            <p className="mt-1 text-xs text-slate-400">One task. One session. No distractions.</p>
                        </div>
                        <span className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold ${style.selected}`}>
                            {running ? "● In progress" : "Ready to begin"}
                        </span>
                    </div>

                    <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-950/20 p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="flex items-center gap-2 text-sm font-bold text-white">
                                    <BookOpen size={16} className="text-emerald-300" aria-hidden="true" />
                                    Study toward a Goal
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                    A completed focus interval adds its full minutes to your selected Goal.
                                </p>
                            </div>
                            <Link to={ROUTES.goals} className="shrink-0 text-xs font-semibold text-emerald-300 hover:text-emerald-200">
                                My Goals
                            </Link>
                        </div>
                        <label htmlFor="focus-goal-select" className="mt-4 block text-xs font-semibold text-slate-300">
                            Link this focus session
                        </label>
                        <select id="focus-goal-select"
                            value={selectedGoalId ?? ""}
                            disabled={goalsLoading || goalLocked}
                            onChange={event => {
                                setSelectedGoalId(event.target.value ? Number(event.target.value) : null);
                                setGoalSummary(null);
                                setSummaryError(false);
                            }}
                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white">
                            <option value="">No Goal — timer only</option>
                            {goals.map(goal => (
                                <option key={goal.id} value={goal.id}>{goal.topic}</option>
                            ))}
                        </select>
                        {goalsLoading && <p className="mt-2 text-xs text-slate-400">Loading Goals…</p>}
                        {goalsError && <p role="alert" className="mt-2 text-xs text-rose-300">{goalsError}</p>}
                        {!goalsLoading && !goalsError && goals.length === 0 && (
                            <p className="mt-2 text-xs text-slate-400">No active Goals yet. Create one to track focus time.</p>
                        )}
                        {goalLocked && (
                            <p className="mt-2 text-xs text-emerald-300">
                                This session is linked to its original Goal until you complete or reset it.
                            </p>
                        )}
                        {chosenGoal && (
                            <div className="mt-4 rounded-xl border border-emerald-400/30 bg-slate-950/80 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-300">
                                        Recorded for this Goal
                                    </p>
                                    <button type="button" onClick={() => setSummaryRevision(value => value + 1)}
                                        className="text-xs font-semibold text-slate-300 hover:text-white">
                                        Refresh
                                    </button>
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-3" aria-live="polite">
                                    <div className="rounded-lg bg-emerald-950/30 p-3">
                                        <p className="text-3xl font-black tabular-nums text-white">
                                            {goalSummary?.goalId === selectedGoalId ? goalSummary.totalMinutes : "—"}
                                        </p>
                                        <p className="mt-1 text-xs font-semibold text-emerald-300">minutes saved</p>
                                    </div>
                                    <div className="rounded-lg bg-emerald-950/30 p-3">
                                        <p className="text-3xl font-black tabular-nums text-white">
                                            {goalSummary?.goalId === selectedGoalId ? goalSummary.completedSessions : "—"}
                                        </p>
                                        <p className="mt-1 text-xs font-semibold text-emerald-300">sessions saved</p>
                                    </div>
                                </div>
                                {summaryError && (
                                    <p role="alert" className="mt-2 text-xs text-rose-300">Totals could not be updated. Tap Refresh.</p>
                                )}
                                <Link to={goalDetailsPath(chosenGoal.id)}
                                    className="mt-3 inline-block text-xs font-semibold text-emerald-300 hover:underline">
                                    View Goal details
                                </Link>
                                <p className="mt-2 text-[11px] text-slate-500">
                                    Confirmed by the server, shared with Mobile. Pending sessions appear separately.
                                </p>
                            </div>
                        )}
                        {!chosenGoal && !goalsLoading && (
                            <p className="mt-2 text-xs text-amber-200/80">
                                Pomodoro still works, but unlinked focus time is not recorded.
                            </p>
                        )}
                        {pendingSync > 0 && (
                            <p className="mt-3 text-xs font-semibold text-amber-200">
                                {pendingSync} completed {pendingSync === 1 ? "session" : "sessions"} waiting to sync.
                            </p>
                        )}
                        {saveError && (
                            <div role="alert" className="mt-3 flex flex-wrap items-center gap-3">
                                <span className="text-xs text-rose-300">{saveError}</span>
                                <button type="button" onClick={retryPending}
                                    className="rounded-lg border border-amber-500/40 px-3 py-1.5 text-xs text-amber-100 hover:bg-amber-950/40">
                                    Retry sync
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 flex flex-wrap gap-1 rounded-xl border border-white/10 bg-slate-950/70 p-1" aria-label="Session type">
                        {MODES.map(mode => (
                            <button type="button" key={mode.id} disabled={running}
                                aria-pressed={timer.mode === mode.id}
                                onClick={() => setTimer(previous => selectPomodoroMode(previous, mode.id))}
                                className={`min-w-0 flex-1 rounded-lg border px-2 py-2.5 text-xs font-semibold transition sm:text-sm ${
                                    timer.mode === mode.id ? style.selected : "border-transparent text-slate-400 hover:bg-white/5 hover:text-white"
                                }`}>
                                {mode.label}
                            </button>
                        ))}
                    </div>

                    <div className="relative mx-auto mt-5 aspect-square w-full max-w-[285px]">
                        <svg viewBox="0 0 250 250" aria-hidden="true" className="h-full w-full -rotate-90">
                            <circle cx="125" cy="125" r="110" fill="none" stroke="#334155" strokeOpacity="0.42" strokeWidth="8" />
                            <circle cx="125" cy="125" r="110" fill="none" stroke={style.outline} strokeWidth="8" strokeLinecap="round"
                                strokeDasharray={CIRCUMFERENCE} strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
                                className="transition-[stroke-dashoffset] duration-500" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <p className={`text-[11px] font-bold uppercase tracking-[0.28em] ${style.accent}`}>
                                {timer.mode === "focus" ? "DEEP WORK" : "TAKE A BREATH"}
                            </p>
                            <span role="timer" aria-live="off" aria-label={remainingLabel + " remaining"}
                                className="mt-3 font-mono text-5xl font-bold tracking-tight tabular-nums text-white sm:text-6xl">{remainingLabel}</span>
                            <p className="mt-2 text-xs font-medium text-slate-400">{running ? "STAY IN THE FLOW" : "ON YOUR TERMS"}</p>
                        </div>
                    </div>

                    <div className="mx-auto mt-2 flex max-w-sm items-center gap-3">
                        <button type="button" onClick={toggleTimer}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold ${style.strong}`}>
                            {running ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" />}
                            {running ? "Pause timer" : remaining < total ? "Resume session" : timer.mode === "focus" ? "Start focusing" : "Start break"}
                        </button>
                        <button type="button" onClick={() => setTimer(previous => resetPomodoro(previous))}
                            title="Reset current session" aria-label="Reset current session"
                            className="rounded-full border border-white/15 bg-white/5 p-3.5 text-slate-200 hover:bg-white/10">
                            <RotateCcw size={19} aria-hidden="true" />
                        </button>
                    </div>

                    <p aria-live="polite" className="mt-5 text-center text-sm text-slate-400">
                        {timer.mode === "focus" ? "Stay curious. Small steps add up." : "Recharge now. Come back refreshed."}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2" aria-label={`${cycle} of 4 sessions until your next long break`}>
                        {[0, 1, 2, 3].map(index => (
                            <span key={index} className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] ${
                                index < cycle ? style.selected : "border-white/10 bg-white/5 text-slate-500"
                            }`}>
                                {index < cycle ? <Check size={13} aria-hidden="true" /> : index + 1}
                            </span>
                        ))}
                        <span className="ml-2 text-xs text-slate-500">Long break every 4 focus sessions</span>
                    </div>
                </section>

                <div className="space-y-5">
                    <section aria-label="Now playing" className="rounded-[26px] border border-white/10 bg-[#111820] p-5 sm:p-7">
                        <div className="flex items-center justify-between gap-3">
                            <p className="flex items-center gap-2 text-sm font-bold text-white">
                                <Music2 size={18} className={style.accent} aria-hidden="true" /> Now playing
                            </p>
                            <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                                <span className={`h-2 w-2 rounded-full ${playing ? "animate-pulse bg-emerald-400" : "bg-slate-600"}`} />
                                {playing ? "Live" : "Paused"}
                            </span>
                        </div>
                        <div className="mt-6 flex items-center gap-4">
                            <TrackArtwork track={timer.preferences.soundscape} compact />
                            <div className="min-w-0">
                                <h3 className="truncate text-lg font-bold text-white">{track.title}</h3>
                                <p className="mt-1 truncate text-xs text-slate-400">{track.kind} · StudyStreak Originals</p>
                            </div>
                        </div>
                        <div className="mt-5 flex items-center justify-center gap-5 border-b border-white/10 pb-5">
                            <button type="button" onClick={() => void toggleAudio()}
                                aria-label={playing ? "Pause soundscape" : "Play soundscape"}
                                className={`flex h-12 w-12 items-center justify-center rounded-full transition hover:scale-105 ${style.strong}`}>
                                {playing ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
                            </button>
                            <span className="text-xs text-slate-400">Original audio · No ads · No streaming</span>
                        </div>
                        <div className="mt-5 flex items-center gap-3">
                            {timer.preferences.volume === 0 ? <VolumeX size={18} className="shrink-0 text-slate-400" aria-hidden="true" />
                                : <Volume2 size={18} className="shrink-0 text-slate-400" aria-hidden="true" />}
                            <input aria-label="Soundscape volume" type="range" min={0} max={100} step={5}
                                value={Math.round(timer.preferences.volume * 100)}
                                onChange={event => changeVolume(Number(event.target.value) / 100)}
                                className="w-full cursor-pointer accent-emerald-400" />
                            <span className="w-10 text-right text-xs tabular-nums text-slate-400">{Math.round(timer.preferences.volume * 100)}%</span>
                        </div>
                        <label className="mt-5 flex cursor-pointer items-center justify-between gap-3 text-xs font-medium text-slate-300">
                            Session start, pause and finish sounds
                            <input type="checkbox" checked={timer.preferences.soundEffects}
                                onChange={event => changePreferences({ soundEffects: event.target.checked })}
                                className="h-4 w-4 accent-emerald-400" />
                        </label>
                        {audioError && <p role="alert" className="mt-4 text-xs text-rose-300">{audioError}</p>}
                    </section>

                    <section className="rounded-[26px] border border-white/10 bg-[#111820] p-5 sm:p-7">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="flex items-center gap-2 text-sm font-bold text-white">
                                    <Settings2 size={18} className={style.accent} aria-hidden="true" /> Make it yours
                                </p>
                                <p className="mt-1 text-xs text-slate-400">Your preferred look and study rhythm.</p>
                            </div>
                            <button type="button" onClick={() => setSettingsOpen(open => !open)}
                                aria-expanded={settingsOpen} aria-controls="focus-studio-settings"
                                className="flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10">
                                {settingsOpen ? "Hide settings" : "Customize"} <ChevronDown size={15} className={settingsOpen ? "rotate-180" : ""} />
                            </button>
                        </div>
                        <div className="mt-5 flex flex-wrap gap-2" aria-label="Focus Studio color theme">
                            {(["aurora", "sunset", "ocean"] as const).map(theme => (
                                <button key={theme} type="button" aria-pressed={timer.preferences.theme === theme}
                                    onClick={() => changePreferences({ theme })}
                                    className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${
                                        timer.preferences.theme === theme
                                            ? style.selected
                                            : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                                    }`}>
                                    <span className={`h-2.5 w-2.5 rounded-full ${THEMES[theme].swatch}`} />
                                    {THEMES[theme].label}
                                </button>
                            ))}
                        </div>
                        {settingsOpen && (
                            <div id="focus-studio-settings" className="mt-5 grid gap-2 border-t border-white/10 pt-5 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                                <DurationInput label="Focus" value={timer.preferences.focusMinutes} min={5} max={120}
                                    disabled={running} onChange={value => changeDuration("focusMinutes", value)} />
                                <DurationInput label="Short break" value={timer.preferences.shortBreakMinutes} min={1} max={30}
                                    disabled={running} onChange={value => changeDuration("shortBreakMinutes", value)} />
                                <DurationInput label="Long break" value={timer.preferences.longBreakMinutes} min={5} max={60}
                                    disabled={running} onChange={value => changeDuration("longBreakMinutes", value)} />
                                <p className="col-span-full mt-1 text-xs leading-5 text-slate-500">Pause the timer to adjust durations. Changing the current interval resets it.</p>
                            </div>
                        )}
                    </section>
                </div>
            </div>

            <FocusInsights refreshKey={statisticsRevision} />

            <section aria-label="Ambient soundscape library" className="space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h2 className="text-2xl font-extrabold tracking-tight text-white">Made for your focus</h2>
                        <p className="mt-1 text-sm text-slate-400">Original instrumentals, noise colors and nature atmospheres. No streaming needed.</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500"><Waves size={16} aria-hidden="true" /> {SOUNDSCAPES.length} original soundscapes</div>
                </div>
                <div className="flex flex-wrap gap-2" aria-label="Filter study sounds by category">
                    {SOUND_CATEGORIES.map(category => (
                        <button key={category.id} type="button"
                            onClick={() => setSoundCategory(category.id)}
                            aria-pressed={soundCategory === category.id}
                            className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                                soundCategory === category.id
                                    ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-200"
                                    : "border-white/10 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white"
                            }`}>
                            {category.label}
                        </button>
                    ))}
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {visibleTracks.map((item) => {
                        const selected = timer.preferences.soundscape === item.id;
                        return (
                            <button type="button" key={item.id} onClick={() => void chooseTrack(item.id)}
                                aria-pressed={selected}
                                aria-label={`Play ${item.title}, ${item.kind}`}
                                className={`group min-w-0 rounded-2xl border p-4 text-left transition hover:-translate-y-1 hover:bg-white/[0.075] ${
                                    selected ? "border-emerald-400/50 bg-emerald-400/[0.06]" : "border-white/10 bg-[#151c25]"
                                }`}>
                                <div className="relative">
                                    <TrackArtwork track={item.id} />
                                    <span className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-400 text-slate-950 shadow-lg shadow-black/30 transition group-hover:scale-110">
                                        {selected && playing ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" />}
                                    </span>
                                </div>
                                <div className="mt-4 flex items-center gap-2">
                                    <span className="text-xs font-semibold text-slate-500">{String(SOUNDSCAPES.findIndex(sound => sound.id === item.id) + 1).padStart(2, "0")}</span>
                                    <h3 className="truncate text-base font-bold text-white">{item.title}</h3>
                                    {selected && <Check size={15} className="ml-auto shrink-0 text-emerald-400" aria-label="Selected" />}
                                </div>
                                <p className="mt-1 text-xs font-semibold text-emerald-300">{item.kind}</p>
                                <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">{item.description}</p>
                            </button>
                        );
                    })}
                </div>
            </section>

            <p className="flex items-center gap-2 border-t border-white/10 pt-5 text-xs text-slate-500">
                <Headphones size={15} aria-hidden="true" />
                Audio is generated locally and plays without ads. Choose a low volume; some tasks are easier in silence. Timer and preferences remain saved in this browser.
            </p>
        </div>
    );
}
