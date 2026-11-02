export type PomodoroMode = "focus" | "shortBreak" | "longBreak";
export type Soundscape = "dream" | "keys" | "rain" | "classical" | "lofi" | "white" | "pink" | "brown" | "forest" | "ocean" | "cafe" | "fireplace";
export type FocusTheme = "aurora" | "sunset" | "ocean";

export interface PomodoroPreferences {
    focusMinutes: number;
    shortBreakMinutes: number;
    longBreakMinutes: number;
    soundscape: Soundscape;
    volume: number;
    soundEffects: boolean;
    theme: FocusTheme;
}

export interface CompletedFocusSession {
    sessionId: string;
    goalId: number;
    durationMinutes: number;
}

export interface PomodoroState {
    mode: PomodoroMode;
    remainingMs: number;
    endsAt: number | null;
    focusSessions: number;
    lastCompletedAt: number | null;
    lastCompletedMode: PomodoroMode | null;
    // The goal and UUID are frozen at the first start, including pauses.
    activeFocusSession: CompletedFocusSession | null;
    pendingFocusSessions: CompletedFocusSession[];
    preferences: PomodoroPreferences;
}

export const DEFAULT_PREFERENCES: PomodoroPreferences = {
    focusMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    soundscape: "dream",
    volume: 0.3,
    soundEffects: true,
    theme: "aurora"
};

const SOUND_IDS: readonly Soundscape[] = [
    "dream", "keys", "rain", "classical", "lofi",
    "white", "pink", "brown", "forest", "ocean", "cafe", "fireplace"
];

const LIMITS = {
    focusMinutes: [5, 120],
    shortBreakMinutes: [1, 30],
    longBreakMinutes: [5, 60]
} as const;

function bounded(value: unknown, fallback: number, min: number, max: number): number {
    return typeof value === "number" && Number.isFinite(value)
        ? Math.min(max, Math.max(min, Math.round(value)))
        : fallback;
}

export function normalizePreferences(value: unknown): PomodoroPreferences {
    const data = value && typeof value === "object" && !Array.isArray(value)
        ? value as Partial<PomodoroPreferences> : {};
    return {
        focusMinutes: bounded(data.focusMinutes, 25, ...LIMITS.focusMinutes),
        shortBreakMinutes: bounded(data.shortBreakMinutes, 5, ...LIMITS.shortBreakMinutes),
        longBreakMinutes: bounded(data.longBreakMinutes, 15, ...LIMITS.longBreakMinutes),
        volume: typeof data.volume === "number" && Number.isFinite(data.volume)
            ? Math.min(1, Math.max(0, data.volume)) : 0.3,
        soundEffects: typeof data.soundEffects === "boolean" ? data.soundEffects : true,
        soundscape: SOUND_IDS.includes(data.soundscape as Soundscape)
            ? data.soundscape as Soundscape : "dream",
        theme: data.theme === "sunset" || data.theme === "ocean"
            ? data.theme : "aurora"
    };
}

export function durationMs(mode: PomodoroMode, preferences: PomodoroPreferences): number {
    return (mode === "focus" ? preferences.focusMinutes
        : mode === "shortBreak" ? preferences.shortBreakMinutes
        : preferences.longBreakMinutes) * 60_000;
}

export function newPomodoro(): PomodoroState {
    return {
        mode: "focus",
        remainingMs: durationMs("focus", DEFAULT_PREFERENCES),
        endsAt: null,
        focusSessions: 0,
        lastCompletedAt: null,
        lastCompletedMode: null,
        activeFocusSession: null,
        pendingFocusSessions: [],
        preferences: { ...DEFAULT_PREFERENCES }
    };
}

export function remainingPomodoroMs(state: PomodoroState, now: number): number {
    return Math.max(0, state.endsAt === null ? state.remainingMs : state.endsAt - now);
}

export function advancePomodoro(state: PomodoroState, now: number): PomodoroState {
    if (state.endsAt === null || now < state.endsAt) return state;
    const completedFocus = state.mode === "focus";
    const sessions = state.focusSessions + (completedFocus ? 1 : 0);
    const pendingFocusSessions = completedFocus && state.activeFocusSession
        ? [...state.pendingFocusSessions, state.activeFocusSession]
        : state.pendingFocusSessions;
    const nextMode: PomodoroMode = completedFocus
        ? (sessions % 4 === 0 ? "longBreak" : "shortBreak")
        : "focus";
    return {
        ...state,
        mode: nextMode,
        focusSessions: sessions,
        endsAt: null,
        remainingMs: durationMs(nextMode, state.preferences),
        lastCompletedAt: now,
        lastCompletedMode: state.mode,
        activeFocusSession: null,
        pendingFocusSessions
    };
}

export function startPomodoro(
    state: PomodoroState, now: number, linkedSession?: CompletedFocusSession | null
): PomodoroState {
    if (state.endsAt !== null) return state;
    return {
        ...state,
        endsAt: now + state.remainingMs,
        activeFocusSession: state.mode === "focus"
            ? (state.activeFocusSession ?? linkedSession ?? null)
            : null
    };
}

export function pausePomodoro(state: PomodoroState, now: number): PomodoroState {
    if (state.endsAt === null) return state;
    if (now >= state.endsAt) return advancePomodoro(state, now);
    return { ...state, remainingMs: remainingPomodoroMs(state, now), endsAt: null };
}

export function resetPomodoro(state: PomodoroState): PomodoroState {
    return { ...state, endsAt: null, activeFocusSession: null,
        remainingMs: durationMs(state.mode, state.preferences) };
}

export function selectPomodoroMode(state: PomodoroState, mode: PomodoroMode): PomodoroState {
    return { ...state, mode, endsAt: null, activeFocusSession: null,
        remainingMs: durationMs(mode, state.preferences) };
}

export function updatePomodoroPreferences(
    state: PomodoroState, changes: Partial<PomodoroPreferences>
): PomodoroState {
    const preferences = normalizePreferences({ ...state.preferences, ...changes });
    const newDuration = durationMs(state.mode, preferences);
    const durationChanged = newDuration !== durationMs(state.mode, state.preferences);
    return {
        ...state,
        preferences,
        // Duration changes reset a paused phase. Music/visual changes never alter the clock.
        remainingMs: durationChanged && state.endsAt === null ? newDuration : state.remainingMs,
        activeFocusSession: durationChanged && state.endsAt === null
            ? null : state.activeFocusSession
    };
}

function validSession(value: unknown): CompletedFocusSession | null {
    if (!value || typeof value !== "object") return null;
    const candidate = value as Partial<CompletedFocusSession>;
    return typeof candidate.sessionId === "string" &&
        /^[a-f0-9-]{36}$/i.test(candidate.sessionId) &&
        Number.isSafeInteger(candidate.goalId) && (candidate.goalId ?? 0) > 0 &&
        Number.isInteger(candidate.durationMinutes) &&
        (candidate.durationMinutes ?? 0) >= 5 && (candidate.durationMinutes ?? 0) <= 120
        ? candidate as CompletedFocusSession : null;
}

export function discardPendingFocusSession(state: PomodoroState, sessionId: string): PomodoroState {
    return { ...state, pendingFocusSessions:
        state.pendingFocusSessions.filter(item => item.sessionId !== sessionId) };
}

export function restorePomodoro(value: unknown, now: number): PomodoroState {
    const initial = newPomodoro();
    if (!value || typeof value !== "object" || Array.isArray(value)) return initial;
    const raw = value as Partial<PomodoroState>;
    const preferences = normalizePreferences(raw.preferences);
    const mode: PomodoroMode = raw.mode === "shortBreak" || raw.mode === "longBreak" ? raw.mode : "focus";
    const limit = durationMs(mode, preferences);
    const saved: PomodoroState = {
        mode,
        preferences,
        remainingMs: bounded(raw.remainingMs, limit, 0, limit),
        endsAt: typeof raw.endsAt === "number" && Number.isFinite(raw.endsAt)
            && raw.endsAt > 0 ? raw.endsAt : null,
        focusSessions: bounded(raw.focusSessions, 0, 0, 100000),
        lastCompletedAt: typeof raw.lastCompletedAt === "number" && Number.isFinite(raw.lastCompletedAt)
            ? raw.lastCompletedAt : null,
        lastCompletedMode: raw.lastCompletedMode === "focus" || raw.lastCompletedMode === "shortBreak"
            || raw.lastCompletedMode === "longBreak" ? raw.lastCompletedMode : null,
        activeFocusSession: mode === "focus" ? validSession(raw.activeFocusSession) : null,
        pendingFocusSessions: Array.isArray(raw.pendingFocusSessions)
            ? raw.pendingFocusSessions.map(validSession)
                .filter((item): item is CompletedFocusSession => item !== null)
                .slice(-100)
            : []
    };
    return advancePomodoro(saved, now);
}

export function formatPomodoroTime(ms: number): string {
    const seconds = Math.max(0, Math.ceil(ms / 1000));
    return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
