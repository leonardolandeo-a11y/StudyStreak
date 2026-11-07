import { Check, LogOut, Monitor, Moon, RotateCcw, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ROUTES } from "../routes/paths";
import { useAppearance, useReducedMotion, useResolvedTheme } from "../theme/appearance";
import type { AccentPalette, ThemeMode } from "../theme/appearance";

const MODES = [{ id: "dark", label: "Dark", icon: Moon }, { id: "light", label: "Light", icon: Sun }, { id: "system", label: "System", icon: Monitor }] as const;
const ACCENTS: AccentPalette[] = ["mint", "blue", "purple", "orange"];

export default function Settings() {
    const { preferences, setPreferences, resetAppearance, storageAvailable } = useAppearance();
    const reducedMotion = useReducedMotion();
    const resolvedTheme = useResolvedTheme();
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    return <div className="mx-auto max-w-4xl space-y-6">
        <header><p className="study-kicker">Make space for your study style</p><h1 className="mt-2 text-3xl font-semibold text-content">Settings</h1><p className="mt-2 text-sm text-content-muted">Appearance preferences apply throughout StudyStreak Web.</p></header>
        <section aria-labelledby="appearance-heading" className="study-panel space-y-6">
            <h2 id="appearance-heading" className="text-xl font-semibold">Appearance</h2>
            <fieldset><legend className="mb-3 text-sm font-semibold">Display mode</legend><div className="grid gap-2 sm:grid-cols-3">
                {MODES.map(({ id, label, icon: Icon }) => <label key={id} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-control border p-3 ${preferences.mode === id ? "border-accent bg-accent-soft" : "border-outline-strong"}`}>
                    <input type="radio" name="display-mode" value={id} checked={preferences.mode === id} onChange={() => setPreferences({ mode: id as ThemeMode })} className="size-4 accent-accent"/>
                    <Icon size={18} aria-hidden="true"/><span>{label}</span>{preferences.mode === id && <Check size={16} className="ml-auto text-accent" aria-hidden="true"/>}
                </label>)}
            </div><p className="mt-2 text-xs text-content-muted" role="status">Currently using {resolvedTheme} appearance{preferences.mode === "system" ? " from your system" : ""}.</p></fieldset>
            <fieldset><legend className="mb-3 text-sm font-semibold">Accent palette</legend><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {ACCENTS.map(accent => <label key={accent} className={`flex min-h-14 cursor-pointer items-center gap-2 rounded-control border p-3 ${preferences.accent === accent ? "border-accent bg-accent-soft" : "border-outline-strong"}`}>
                    <input type="radio" name="accent-palette" value={accent} checked={preferences.accent === accent} onChange={() => setPreferences({ accent })} className="size-4 accent-accent"/>
                    <span className="capitalize">{accent}</span>{preferences.accent === accent && <Check size={16} className="ml-auto shrink-0 text-accent" aria-hidden="true"/>}
                </label>)}
            </div></fieldset>
            <figure aria-labelledby="appearance-preview" className="rounded-panel border border-outline bg-canvas p-4">
                <figcaption id="appearance-preview" className="text-sm font-semibold">Appearance preview</figcaption>
                <div className="mt-3 flex flex-wrap items-center gap-3"><span className="rounded-control bg-accent px-4 py-2 font-semibold text-on-accent">Primary action</span><span className="rounded-control border border-accent bg-accent-soft px-3 py-2 text-accent">Selected</span><span className="text-content-muted">Secondary text</span></div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-hover" role="img" aria-label="Preview progress: 60 percent"><div className="h-full w-3/5 bg-accent"/></div>
                <p className="mt-3 text-xs text-content-muted">Errors, warnings and success keep their own semantic colors.</p>
            </figure>
            <button type="button" className="study-button" onClick={resetAppearance}><RotateCcw size={16} aria-hidden="true"/>Restore default appearance</button>
            <p role="status" className={`text-sm ${storageAvailable ? "text-content-muted" : "text-warning"}`}>{storageAvailable ? "Preferences are local to this browser and do not sync between devices." : "Browser storage is unavailable. Changes apply for this visit and may be lost on reload."}</p>
        </section>
        <section aria-labelledby="accessibility-heading" className="study-panel space-y-3">
            <h2 id="accessibility-heading" className="text-xl font-semibold">Accessibility</h2>
            <label className="flex min-h-11 cursor-pointer items-center gap-3"><input type="checkbox" checked={preferences.reduceMotion} onChange={event => setPreferences({ reduceMotion: event.target.checked })} className="size-5 accent-accent"/><span>Always reduce motion</span></label>
            <p className="text-sm text-content-muted" role="status">{reducedMotion ? "Reduced motion is active." : "Standard motion is active."} Your system’s reduced motion preference is always respected.</p>
            <p className="text-xs text-content-muted">Keyboard focus stays visible in every theme. Pomodoro durations and session sounds remain in Focus Studio’s gear dialog.</p>
        </section>
        <section aria-labelledby="account-heading" className="study-panel space-y-3">
            <h2 id="account-heading" className="text-xl font-semibold">Account</h2>
            {currentUser && <p className="break-words text-sm text-content-secondary">Signed in as {currentUser.username} · {currentUser.email}</p>}
            <button type="button" className="study-button" onClick={() => { logout(); navigate(ROUTES.login); }}><LogOut size={16} aria-hidden="true"/>Sign out</button>
        </section>
    </div>;
}
