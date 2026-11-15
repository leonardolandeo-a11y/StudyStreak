import { useContext, useEffect, useLayoutEffect, useState } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { APPEARANCE_KEY, AppearanceContext, DEFAULT_APPEARANCE } from "./appearance";
import type { AppearancePreferences } from "./appearance";

const read = (userId: number | null) => typeof window === "undefined"
    ? DEFAULT_APPEARANCE : window.studyStreakAppearance?.read(userId) ?? DEFAULT_APPEARANCE;

export function ThemeProvider({ children }: { children: ReactNode }) {
    const auth = useContext(AuthContext);
    const userId = auth?.currentUser?.id ?? null;
    const [state, setState] = useState(() => ({ userId, preferences: read(userId), storageAvailable: true }));
    // Adjust before rendering children, without remounting the router or audio tree.
    const preferences = state.userId === userId ? state.preferences : read(userId);
    if (state.userId !== userId) setState({ userId, preferences, storageAvailable: true });

    useLayoutEffect(() => { window.studyStreakAppearance?.activate(userId); }, [userId]);
    useLayoutEffect(() => { window.studyStreakAppearance?.apply(preferences); }, [preferences]);
    useEffect(() => {
        const onStorage = (event: StorageEvent) => {
            if (event.key === window.studyStreakAppearance?.accountKey(userId) || event.key === `${APPEARANCE_KEY}:legacy-owner` || event.key === null) {
                setState(previous => previous.userId === userId ? { ...previous, preferences: read(userId) } : previous);
            }
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, [userId]);

    function setPreferences(changes: Partial<AppearancePreferences>) {
        const next = window.studyStreakAppearance?.normalize({ ...preferences, ...changes }) ?? { ...preferences, ...changes };
        window.studyStreakAppearance?.apply(next);
        const storageAvailable = window.studyStreakAppearance?.save(next, userId) ?? false;
        setState({ userId, preferences: next, storageAvailable });
    }
    return <AppearanceContext.Provider value={{ preferences, setPreferences, resetAppearance: () => setPreferences(DEFAULT_APPEARANCE), storageAvailable: state.storageAvailable }}>{children}</AppearanceContext.Provider>;
}
