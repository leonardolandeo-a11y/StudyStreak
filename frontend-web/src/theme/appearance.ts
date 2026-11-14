import { createContext, useContext, useSyncExternalStore } from "react";

export type ThemeMode = "dark" | "light" | "system";
export type AccentPalette = "mint" | "blue" | "purple" | "orange";
export type BackgroundTheme = "neutral" | "lavender" | "sage" | "amber" | "sky";
export interface AppearancePreferences { mode: ThemeMode; background: BackgroundTheme; accent: AccentPalette; reduceMotion: boolean; }
export const DEFAULT_APPEARANCE: AppearancePreferences = { mode: "system", background: "neutral", accent: "mint", reduceMotion: false };
export const APPEARANCE_KEY = "studystreak:appearance:v2";

declare global {
    interface Window {
        studyStreakAppearance?: {
            key: string;
            defaults: AppearancePreferences;
            normalize: (value: unknown) => AppearancePreferences;
            accountKey: (userId: number | null) => string | null;
            activate: (userId: number | null) => void;
            read: (userId?: number | null) => AppearancePreferences;
            apply: (value: AppearancePreferences) => void;
            save: (value: AppearancePreferences, userId?: number | null) => boolean;
        };
    }
}

interface AppearanceContextValue {
    preferences: AppearancePreferences;
    setPreferences: (changes: Partial<AppearancePreferences>) => void;
    resetAppearance: () => void;
    storageAvailable: boolean;
}

export const AppearanceContext = createContext<AppearanceContextValue>({
    preferences: DEFAULT_APPEARANCE, setPreferences() {}, resetAppearance() {}, storageAvailable: true,
});
export const useAppearance = () => useContext(AppearanceContext);

const subscribe = (query: string, notify: () => void) => {
    const media = window.matchMedia(query);
    media.addEventListener("change", notify);
    return () => media.removeEventListener("change", notify);
};
const subscribeMotion = (notify: () => void) => subscribe("(prefers-reduced-motion: reduce)", notify);
const subscribeScheme = (notify: () => void) => subscribe("(prefers-color-scheme: dark)", notify);
export function useReducedMotion() {
    const { preferences } = useAppearance();
    const system = useSyncExternalStore(subscribeMotion, () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => false);
    return preferences.reduceMotion || system;
}
export function useResolvedTheme() {
    const { preferences } = useAppearance();
    const systemDark = useSyncExternalStore(subscribeScheme, () => window.matchMedia("(prefers-color-scheme: dark)").matches, () => true);
    return preferences.mode === "system" ? (systemDark ? "dark" : "light") : preferences.mode;
}
