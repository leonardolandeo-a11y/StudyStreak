import { useId } from "react";
import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { Switch } from "../ui/switch";
import { useAppearance, useResolvedTheme } from "../../theme/appearance";
import type { AccentPalette, BackgroundTheme } from "../../theme/appearance";

function AppearanceOption({ name, value, label, selected, disabled = false, onSelect, children, size }: {
    name: string;
    value: string;
    label: string;
    selected: boolean;
    disabled?: boolean;
    onSelect: () => void;
    children: ReactNode;
    size: "size-20" | "size-12" | "h-12 w-16";
}) {
    return <label className={`relative flex shrink-0 flex-col items-center gap-2 ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
        <input type="radio" name={name} value={value} checked={selected} disabled={disabled} onChange={onSelect} className="peer sr-only" />
        <span className={`relative rounded-control border-2 p-1 peer-focus-visible:outline-2 peer-focus-visible:outline-focus peer-focus-visible:outline-offset-4 ${size} ${selected ? "border-accent" : "border-outline-strong"}`}>
            {children}
            {selected && <span aria-hidden="true" className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full border border-surface bg-accent text-on-accent"><Check size={13} strokeWidth={3}/></span>}
        </span>
        <span className="text-xs font-medium capitalize text-content-secondary">{label}</span>
    </label>;
}

export function AppearanceSelectors() {
    const { preferences, setPreferences } = useAppearance();
    const resolvedTheme = useResolvedTheme();
    const deviceTheme = preferences.mode === "system";
    const deviceLabel = useId();
    const deviceSwitch = useId();
    const modeHelp = useId();
    return <div className="space-y-4">
        <fieldset aria-describedby={modeHelp}>
            <legend className="mb-3 text-sm font-semibold">Display mode</legend>
            <div className="flex flex-wrap gap-5">
                {(["dark", "light"] as const).map(mode => <AppearanceOption key={mode} name="display-mode" value={mode} label={mode}
                    selected={resolvedTheme === mode} disabled={deviceTheme} onSelect={() => setPreferences({ mode })} size="size-20">
                    <span aria-hidden="true" style={{ colorScheme: mode }} className="flex size-full flex-col gap-1.5 rounded-lg bg-canvas p-1.5">
                        <span className="h-1 w-3/5 rounded-full bg-content-muted" />
                        <span className="flex min-h-0 flex-1 gap-1"><span className="w-1/4 rounded-sm bg-surface-hover"/><span className="flex flex-1 flex-col gap-1 rounded-sm border border-outline bg-surface p-1"><span className="h-1 w-3/4 rounded-full bg-content-muted"/><span className="h-1 w-1/2 rounded-full bg-surface-hover"/></span></span>
                    </span>
                </AppearanceOption>)}
            </div>
            <p id={modeHelp} className="mt-3 text-xs text-content-muted">{deviceTheme ? "Turn off Use device theme to choose a mode manually." : "Choose your preferred appearance."}</p>
        </fieldset>
        <div className="flex items-center justify-between gap-4 border-t border-outline pt-3">
            <div><label htmlFor={deviceSwitch} id={deviceLabel} className="cursor-pointer text-sm font-semibold">Use device theme</label><p className="mt-1 text-xs text-content-muted">Follow your device’s light or dark appearance automatically.</p></div>
            <Switch id={deviceSwitch} checked={deviceTheme} labelledBy={deviceLabel} onCheckedChange={enabled => setPreferences({ mode: enabled ? "system" : resolvedTheme })}/>
        </div>
        <p className="text-xs text-content-muted" role="status">Currently using {resolvedTheme} appearance{deviceTheme ? " from your system" : ""}.</p>
        <fieldset><legend className="mb-3 text-sm font-semibold">Background theme</legend>
            <div className="flex flex-wrap gap-4">
                {(["neutral", "lavender", "sage", "amber", "sky"] as BackgroundTheme[]).map(background => <AppearanceOption key={background} name="background-theme" value={background} label={background}
                    selected={preferences.background === background} onSelect={() => setPreferences({ background })} size="h-12 w-16">
                    <span aria-hidden="true" data-background={background} className="background-swatch flex size-full overflow-hidden rounded-md">
                        <span className="w-1/2 bg-canvas" style={{ colorScheme: "light" }}/>
                        <span className="w-1/2 bg-canvas" style={{ colorScheme: "dark" }}/>
                    </span>
                </AppearanceOption>)}
            </div>
        </fieldset>
        <fieldset><legend className="mb-3 text-sm font-semibold">Accent palette</legend><div className="flex flex-wrap gap-4">
            {(["mint", "blue", "purple", "orange"] as AccentPalette[]).map(accent => <AppearanceOption key={accent} name="accent-palette" value={accent} label={accent}
                selected={preferences.accent === accent} onSelect={() => setPreferences({ accent })} size="size-12">
                <span aria-hidden="true" style={{ backgroundColor: `var(--ss-accent-${accent})` }} className="block size-full rounded-md"/>
            </AppearanceOption>)}
        </div></fieldset>
    </div>;
}
