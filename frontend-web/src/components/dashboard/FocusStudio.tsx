import { useEffect, useRef, useState } from "react";
import {
    Check, Clock3, Headphones, Music2, Pause, Play,
    RotateCcw, SlidersHorizontal, Sparkles, Volume2, VolumeX
} from "lucide-react";
import { PomodoroAudio } from "./pomodoroAudio";
import {
    advancePomodoro,
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
    FocusTheme, PomodoroMode, PomodoroPreferences,
    PomodoroState, Soundscape
} from "./pomodoroState";

const CIRCUMFERENCE = 2 * Math.PI * 104;

const MODE_LABEL: Record<PomodoroMode, string> = {
    focus: "Focus",
    shortBreak: "Short break",
    longBreak: "Long break"
};

const MODE_DESCRIPTION: Record<PomodoroMode, string> = {
    focus: "One thing at a time. You've got this.",
    shortBreak: "A little space to recharge.",
    longBreak: "You've earned a longer reset."
};

const THEME: Record<FocusTheme, {
    name: string;
    panel: string;
    halo: string;
    ring: string;
    text: string;
    button: string;
    active: string;
}> = {
    aurora: {
        name: "Aurora",
        panel: "from-emerald-950/90 via-slate-950 to-cyan-950/80",
        halo: "bg-emerald-400/15",
        ring: "#5eead4",
        text: "text-emerald-200",
        button: "bg-emerald-300 text-slate-950 hover:bg-emerald-200",
        active: "border-emerald-400/70 bg-emerald-400/15 text-emerald-100"
    },
    sunset: {
        name: "Sunset",
        panel: "from-rose-950/90 via-slate-950 to-amber-950/70",
        halo: "bg-rose-400/15",
        ring: "#fda4af",
        text: "text-rose-200",
        button: "bg-rose-300 text-slate-950 hover:bg-rose-200",
        active: "border-rose-400/70 bg-rose-400/15 text-rose-100"
    },
    ocean: {
        name: "Ocean",
        panel: "from-blue-950/90 via-slate-950 to-indigo-950/80",
        halo: "bg-sky-400/15",
        ring: "#7dd3fc",
        text: "text-sky-200",
        button: "bg-sky-300 text-slate-950 hover:bg-sky-200",
        active: "border-sky-400/70 bg-sky-400/15 text-sky-100"
    }
};

const SOUND_OPTIONS: { id: Soundscape; title: string; subtitle: string }[] = [
    { id: "dream", title: "Dream pads", subtitle: "Airy ambient melodies" },
    { id: "keys", title: "Soft keys", subtitle: "Gentle piano-like notes" },
    { id: "rain", title: "Rainfall", subtitle: "Soft rain noise" }
];

function loadPomodoro(key: string): PomodoroState {
    try {
        const value = window.localStorage.getItem(key);
        return value ? restorePomodoro(JSON.parse(value) as unknown, Date.now()) : newPomodoro();
    } catch {
        return newPomodoro();
    }
}

function MinuteControl({
    label, name, min, max, value, disabled, onChange
}: {
    label: string;
    name: "focusMinutes" | "shortBreakMinutes" | "longBreakMinutes";
    min: number;
    max: number;
    value: number;
    disabled: boolean;
    onChange: (name: "focusMinutes" | "shortBreakMinutes" | "longBreakMinutes", value: number) => void;
}) {
    return (
        <label className="flex flex-1 items-center justify-between gap-2 rounded-xl border border-white/10 bg-slate-950/60 px-3 py-3">
            <span className="text-xs font-medium text-slate-300">{label}</span>
            <span className="flex items-center gap-1">
                <input
                    aria-label={label + " minutes"}
                    type="number"
                    inputMode="numeric"
                    min={min}
                    max={max}
                    step={1}
                    value={value}
                    disabled={disabled}
                    onChange={event => {
                        if (event.target.value !== "") onChange(name, Number(event.target.value));
                    }}
                    className="w-14 rounded-md border border-slate-700 bg-slate-900 px-1.5 py-1 text-center text-sm font-semibold text-slate-100"
                />
                <span className="text-xs text-slate-500">m</span>
            </span>
        </label>
    );
}

export default function FocusStudio({ userId }: { userId: number }) {
    const storageKey = `studystreak:focus-studio:v1:${userId}`;
    const [timer, setTimer] = useState<PomodoroState>(() => loadPomodoro(storageKey));
    const [clockNow, setClockNow] = useState(() => Date.now());
    const [musicPlaying, setMusicPlaying] = useState(false);
    const [audioError, setAudioError] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const audioRef = useRef<PomodoroAudio | null>(null);
    const notifiedAtRef = useRef<number | null>(timer.lastCompletedAt);

    const getAudio = () => {
        if (!audioRef.current) audioRef.current = new PomodoroAudio();
        return audioRef.current;
    };

    useEffect(() => {
        const update = () => {
            const current = Date.now();
            setClockNow(current);
            setTimer(previous => advancePomodoro(previous, current));
        };
        const interval = window.setInterval(update, 500);
        window.addEventListener("focus", update);
        document.addEventListener("visibilitychange", update);
        return () => {
            window.clearInterval(interval);
            window.removeEventListener("focus", update);
            document.removeEventListener("visibilitychange", update);
        };
    }, []);

    useEffect(() => {
        try {
            window.localStorage.setItem(storageKey, JSON.stringify(timer));
        } catch {
            // Private browsing and limited storage should not prevent using the timer.
        }
    }, [storageKey, timer]);

    useEffect(() => {
        if (timer.lastCompletedAt !== null && timer.lastCompletedAt !== notifiedAtRef.current) {
            notifiedAtRef.current = timer.lastCompletedAt;
            if (timer.preferences.soundEffects) {
                void getAudio().cue("complete", timer.preferences.volume);
            }
        }
    }, [timer.lastCompletedAt, timer.preferences.soundEffects, timer.preferences.volume]);

    useEffect(() => () => {
        audioRef.current?.dispose();
        audioRef.current = null;
    }, []);

    const remaining = remainingPomodoroMs(timer, clockNow);
    const total = durationMs(timer.mode, timer.preferences);
    const progress = total > 0 ? Math.min(1, Math.max(0, 1 - remaining / total)) : 0;
    const active = timer.endsAt !== null;
    const style = THEME[timer.preferences.theme];
    const currentCycle = timer.focusSessions % 4;
    const statusLabel = timer.lastCompletedAt && !active
        ? timer.lastCompletedMode === "focus" && timer.mode !== "focus"
            ? "Focus complete. Your break is ready."
            : timer.lastCompletedMode !== "focus" && timer.mode === "focus"
                ? "Break finished. Ready to focus?"
                : MODE_DESCRIPTION[timer.mode]
        : MODE_DESCRIPTION[timer.mode];

    function cue(kind: "start" | "pause") {
        if (timer.preferences.soundEffects) {
            void getAudio().cue(kind, timer.preferences.volume);
        }
    }

    function startOrPause() {
        const current = Date.now();
        setClockNow(current);
        if (active) {
            setTimer(previous => pausePomodoro(previous, current));
            cue("pause");
        } else {
            setTimer(previous => startPomodoro(previous, current));
            cue("start");
        }
    }

    function changeMode(mode: PomodoroMode) {
        setTimer(previous => selectPomodoroMode(previous, mode));
    }

    function changeMinutes(name: "focusMinutes" | "shortBreakMinutes" | "longBreakMinutes", value: number) {
        if (active) return;
        const updates: Partial<PomodoroPreferences> = { [name]: value };
        setTimer(previous => updatePomodoroPreferences(previous, updates));
    }

    function updatePreference(changes: Partial<PomodoroPreferences>) {
        setTimer(previous => updatePomodoroPreferences(previous, changes));
    }

    async function toggleMusic() {
        if (musicPlaying) {
            getAudio().stop();
            setMusicPlaying(false);
            return;
        }
        setAudioError(null);
        const played = await getAudio().start(timer.preferences.soundscape, timer.preferences.volume);
        if (played) setMusicPlaying(true);
        else setAudioError("Audio is unavailable. Check your browser settings.");
    }

    async function chooseSoundscape(selected: Soundscape) {
        updatePreference({ soundscape: selected });
        if (musicPlaying) {
            const played = await getAudio().start(selected, timer.preferences.volume);
            if (!played) {
                setMusicPlaying(false);
                setAudioError("Audio could not be restarted.");
            }
        }
    }

    function changeVolume(value: number) {
        updatePreference({ volume: value });
        audioRef.current?.setVolume(value);
    }

    return (
        <section aria-label="Focus Studio Pomodoro timer" className="overflow-hidden rounded-3xl border border-slate-700/70 bg-slate-900/70 shadow-xl shadow-black/20">
            <div className={`relative isolate overflow-hidden bg-gradient-to-br ${style.panel} p-5 sm:p-8`}>
                <div aria-hidden="true" className={`pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full blur-3xl ${style.halo}`} />
                <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 left-10 h-64 w-96 rounded-full bg-indigo-400/10 blur-3xl" />

                <div className="relative flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] ${style.text}`}>
                            <Sparkles size={15} aria-hidden="true" /> YOUR FOCUS SPACE
                        </p>
                        <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">Focus Studio</h2>
                        <p className="mt-1 text-sm text-slate-300">Study with a rhythm that works for you.</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/40 px-3 py-2 text-xs font-medium text-slate-200">
                        <Clock3 size={15} aria-hidden="true" />
                        {timer.focusSessions} completed focus {timer.focusSessions === 1 ? "session" : "sessions"}
                    </div>
                </div>

                <div className="relative mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center">
                    <div className="flex flex-col items-center">
                        <div className="inline-flex w-full max-w-md items-center justify-center gap-1 rounded-2xl border border-white/10 bg-slate-950/50 p-1">
                            {(["focus", "shortBreak", "longBreak"] as const).map(mode => (
                                <button
                                    key={mode}
                                    type="button"
                                    aria-pressed={timer.mode === mode}
                                    disabled={active}
                                    onClick={() => changeMode(mode)}
                                    className={`flex-1 rounded-xl border px-2 py-2 text-xs font-semibold sm:text-sm ${
                                        timer.mode === mode
                                            ? style.active
                                            : "border-transparent text-slate-400 hover:bg-white/5 hover:text-white"
                                    }`}
                                >
                                    {MODE_LABEL[mode]}
                                </button>
                            ))}
                        </div>

                        <div className="relative mt-5 aspect-square w-full max-w-[275px]">
                            <svg viewBox="0 0 240 240" className="h-full w-full -rotate-90" aria-hidden="true">
                                <circle cx="120" cy="120" r="104" stroke="white" strokeOpacity="0.1" strokeWidth="9" fill="none" />
                                <circle cx="120" cy="120" r="104" stroke={style.ring}
                                    strokeWidth="9" strokeLinecap="round" fill="none"
                                    strokeDasharray={CIRCUMFERENCE}
                                    strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
                                    className="transition-[stroke-dashoffset] duration-500"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                                    {timer.mode === "focus" ? "DEEP WORK" : "REST MODE"}
                                </span>
                                <span role="timer" aria-label={`${formatPomodoroTime(remaining)} remaining`}
                                    className="mt-2 font-mono text-5xl font-bold tracking-tight tabular-nums text-white sm:text-6xl">
                                    {formatPomodoroTime(remaining)}
                                </span>
                                <span className="mt-2 text-xs font-medium text-slate-300">{active ? "IN PROGRESS" : "READY WHEN YOU ARE"}</span>
                            </div>
                        </div>

                        <div className="mt-4 flex w-full max-w-sm items-center justify-center gap-3">
                            <button type="button" onClick={startOrPause}
                                className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3 font-bold shadow-lg ${style.button}`}>
                                {active ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" />}
                                {active ? "Pause" : remaining < total ? "Resume" : timer.mode === "focus" ? "Start focus" : "Start break"}
                            </button>
                            <button type="button" onClick={() => setTimer(previous => resetPomodoro(previous))}
                                aria-label="Reset current timer" title="Reset timer"
                                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 p-3 text-slate-200 hover:bg-white/10">
                                <RotateCcw size={20} />
                            </button>
                        </div>
                        <p aria-live="polite" className="mt-4 text-center text-sm text-slate-300">{statusLabel}</p>
                        <div className="mt-3 flex items-center gap-2" aria-label={`${currentCycle} of 4 sessions toward the next long break`}>
                            {[0, 1, 2, 3].map(index => (
                                <span key={index} className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${index < currentCycle
                                    ? "border-emerald-400/60 bg-emerald-500/30 text-emerald-100"
                                    : "border-white/15 bg-white/5 text-slate-500"}`}>
                                    {index < currentCycle ? <Check size={13} aria-hidden="true" /> : index + 1}
                                </span>
                            ))}
                            <span className="ml-2 text-xs text-slate-400">Long break every 4 sessions</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-5 backdrop-blur-sm">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="flex items-center gap-2 text-base font-semibold text-white">
                                        <Headphones size={19} className={style.text} aria-hidden="true" /> Background audio
                                    </p>
                                    <p className="mt-1 text-xs text-slate-400">Original music and soundscapes, generated locally.</p>
                                </div>
                                <button type="button" aria-pressed={musicPlaying} onClick={() => void toggleMusic()}
                                    className={`rounded-xl px-3 py-2 text-xs font-bold ${musicPlaying
                                        ? style.button : "border border-white/15 bg-white/10 text-white hover:bg-white/20"}`}>
                                    {musicPlaying ? "Stop audio" : "Play audio"}
                                </button>
                            </div>

                            <div className="mt-4 space-y-2">
                                {SOUND_OPTIONS.map(sound => (
                                    <button type="button" key={sound.id}
                                        onClick={() => void chooseSoundscape(sound.id)}
                                        aria-pressed={timer.preferences.soundscape === sound.id}
                                        className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left transition ${
                                            timer.preferences.soundscape === sound.id
                                                ? style.active
                                                : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25"
                                        }`}>
                                        <span className="flex items-center gap-3">
                                            <Music2 size={18} aria-hidden="true" />
                                            <span>
                                                <span className="block text-sm font-semibold">{sound.title}</span>
                                                <span className="block text-xs opacity-70">{sound.subtitle}</span>
                                            </span>
                                        </span>
                                        {timer.preferences.soundscape === sound.id && <Check size={16} aria-hidden="true" />}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-5 flex items-center gap-3">
                                {timer.preferences.volume === 0 ? <VolumeX size={18} className="text-slate-400" /> :
                                    <Volume2 size={18} className="text-slate-400" />}
                                <input type="range" aria-label="Background audio volume" min={0} max={100} step={5}
                                    value={Math.round(timer.preferences.volume * 100)}
                                    onChange={event => changeVolume(Number(event.target.value) / 100)}
                                    className="w-full cursor-pointer accent-emerald-300" />
                                <span className="w-10 text-right text-xs tabular-nums text-slate-400">
                                    {Math.round(timer.preferences.volume * 100)}%
                                </span>
                            </div>

                            <label className="mt-4 flex cursor-pointer items-center justify-between gap-3 border-t border-white/10 pt-4 text-sm text-slate-300">
                                <span>Session sound effects</span>
                                <input type="checkbox" checked={timer.preferences.soundEffects}
                                    onChange={event => updatePreference({ soundEffects: event.target.checked })}
                                    className="h-4 w-4 accent-emerald-300" />
                            </label>
                            {audioError && <p role="alert" className="mt-3 text-xs text-rose-300">{audioError}</p>}
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-5 backdrop-blur-sm">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-base font-semibold text-white">Make it yours</p>
                                    <p className="mt-1 text-xs text-slate-400">Set your mood and study intervals.</p>
                                </div>
                                <button type="button" aria-expanded={showSettings} aria-controls="pomodoro-settings"
                                    onClick={() => setShowSettings(!showSettings)}
                                    className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-200 hover:bg-white/10">
                                    <SlidersHorizontal size={15} /> {showSettings ? "Hide" : "Customize"}
                                </button>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2" aria-label="Pomodoro appearance">
                                {(["aurora", "sunset", "ocean"] as const).map(theme => (
                                    <button type="button" key={theme}
                                        aria-pressed={timer.preferences.theme === theme}
                                        onClick={() => updatePreference({ theme })}
                                        className={`rounded-full border px-3 py-2 text-xs font-semibold ${timer.preferences.theme === theme
                                            ? style.active : "border-white/10 bg-white/5 text-slate-400 hover:text-white"}`}>
                                        {THEME[theme].name}
                                    </button>
                                ))}
                            </div>

                            {showSettings && (
                                <div id="pomodoro-settings" className="mt-4">
                                    <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
                                        <MinuteControl label="Focus" name="focusMinutes" min={5} max={120}
                                            disabled={active} value={timer.preferences.focusMinutes} onChange={changeMinutes} />
                                        <MinuteControl label="Short" name="shortBreakMinutes" min={1} max={30}
                                            disabled={active} value={timer.preferences.shortBreakMinutes} onChange={changeMinutes} />
                                        <MinuteControl label="Long" name="longBreakMinutes" min={5} max={60}
                                            disabled={active} value={timer.preferences.longBreakMinutes} onChange={changeMinutes} />
                                    </div>
                                    <p className="mt-3 text-xs leading-5 text-slate-400">
                                        Pause to change durations. A duration change resets the selected interval.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="relative mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4 text-xs text-slate-400">
                    <span>Stay in the zone. Progress and preferences are saved in this browser.</span>
                    <span>Music stops when you leave the dashboard; your timer keeps its time.</span>
                </div>
            </div>
        </section>
    );
}
