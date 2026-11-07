import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import { DEFAULT_PREFERENCES } from "../dashboard/pomodoroState";
import type { PomodoroPreferences } from "../dashboard/pomodoroState";

export type PomodoroDurations = Pick<PomodoroPreferences, "focusMinutes" | "shortBreakMinutes" | "longBreakMinutes">;
type DurationField = keyof PomodoroDurations;

const FIELDS: { field: DurationField; label: string; min: number; max: number }[] = [
    { field: "focusMinutes", label: "Focus", min: 5, max: 120 },
    { field: "shortBreakMinutes", label: "Short break", min: 1, max: 30 },
    { field: "longBreakMinutes", label: "Long break", min: 5, max: 60 }
];

const draftOf = (preferences: PomodoroDurations) => ({
    focusMinutes: String(preferences.focusMinutes),
    shortBreakMinutes: String(preferences.shortBreakMinutes),
    longBreakMinutes: String(preferences.longBreakMinutes)
});

interface FocusDurationDialogProps {
    onClose: () => void;
    preferences: PomodoroPreferences;
    locked: boolean;
    onSave: (durations: PomodoroDurations) => void;
}

// Mounted only while open: each opening starts from the saved preferences.
// Native showModal supplies focus containment, background inertness and restoration.
export function FocusDurationDialog({ onClose, preferences, locked, onSave }: FocusDurationDialogProps) {
    const dialog = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const descriptionId = useId();
    const [draft, setDraft] = useState(() => draftOf(preferences));

    useEffect(() => { dialog.current?.showModal(); }, []);

    function close() {
        dialog.current?.close();
        onClose();
    }

    return (
        <dialog ref={dialog} aria-labelledby={titleId} aria-describedby={descriptionId}
            onCancel={event => { event.preventDefault(); close(); }}
            className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-sm overflow-y-auto rounded-panel border border-outline-strong bg-surface p-5 text-content shadow-2xl backdrop:bg-black/60">
            <form onSubmit={event => {
                event.preventDefault();
                if (locked || !event.currentTarget.reportValidity()) return;
                onSave({ focusMinutes: Number(draft.focusMinutes), shortBreakMinutes: Number(draft.shortBreakMinutes), longBreakMinutes: Number(draft.longBreakMinutes) });
                close();
            }}>
                <div className="flex items-center justify-between gap-3">
                    <h2 id={titleId} className="text-lg font-semibold">Pomodoro durations</h2>
                    <button type="button" className="study-button size-11 shrink-0 p-0" aria-label="Close Pomodoro durations" onClick={close}>
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>
                <p id={descriptionId} className="mt-2 text-sm text-content-muted">
                    {locked ? "Finish or reset your current session before changing durations." : "Changes apply when saved. Changing the current interval resets it."}
                </p>
                <div className="mt-4 space-y-3">
                    {FIELDS.map(({ field, label, min, max }) => (
                        <label key={field} className="flex items-center justify-between gap-3 rounded-control border border-outline bg-canvas px-3 py-2">
                            <span className="text-sm text-content-secondary">{label}</span>
                            <span className="flex items-center gap-2">
                                <input type="number" inputMode="numeric" aria-label={`${label} minutes`} min={min} max={max} step={1} required
                                    disabled={locked} value={draft[field]} onChange={event => setDraft(previous => ({ ...previous, [field]: event.target.value }))}
                                    className="min-h-11 w-16 rounded-control border border-outline-strong bg-surface px-2 py-1 text-center text-base font-semibold text-content" />
                                <span className="text-xs text-content-muted">min</span>
                            </span>
                        </label>
                    ))}
                </div>
                <p className="mt-3 text-xs text-content-muted">Long break every 4 focus sessions (fixed).</p>
                <button type="button" className="study-button mt-3 text-xs" disabled={locked} onClick={() => setDraft(draftOf(DEFAULT_PREFERENCES))}>Restore defaults</button>
                <div className="mt-4 flex justify-end gap-2">
                    <button type="button" className="study-button" onClick={close}>Cancel</button>
                    <button type="submit" disabled={locked} className="study-button border-accent bg-accent text-on-accent hover:bg-accent-hover">Save</button>
                </div>
            </form>
        </dialog>
    );
}
