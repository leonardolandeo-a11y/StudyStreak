import { useEffect, useLayoutEffect, useState } from "react";
import type { ReactNode } from "react";
import { APPEARANCE_KEY, AppearanceContext, DEFAULT_APPEARANCE } from "./appearance";
import type { AppearancePreferences } from "./appearance";

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [preferences, setState] = useState<AppearancePreferences>(() =>
        typeof window === "undefined" ? DEFAULT_APPEARANCE : window.studyStreakAppearance?.read() ?? DEFAULT_APPEARANCE);
    const [storageAvailable, setStorageAvailable] = useState(true);

    useLayoutEffect(() => { window.studyStreakAppearance?.apply(preferences); }, [preferences]);
    useEffect(() => {
        const onStorage = (event: StorageEvent) => {
            if (event.key === APPEARANCE_KEY || event.key === null) setState(window.studyStreakAppearance?.read() ?? DEFAULT_APPEARANCE);
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    function setPreferences(changes: Partial<AppearancePreferences>) {
        const next = window.studyStreakAppearance?.normalize({ ...preferences, ...changes }) ?? { ...preferences, ...changes };
        window.studyStreakAppearance?.apply(next);
        setState(next);
        setStorageAvailable(window.studyStreakAppearance?.save(next) ?? false);
    }
    return <AppearanceContext.Provider value={{ preferences, setPreferences, resetAppearance: () => setPreferences(DEFAULT_APPEARANCE), storageAvailable }}>{children}</AppearanceContext.Provider>;
}
