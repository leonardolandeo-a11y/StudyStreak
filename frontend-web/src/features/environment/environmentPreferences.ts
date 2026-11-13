import type { StudyPeriod } from '../../components/auth/studyPeriod';
export const sceneLabels = { campus: 'Sunset Campus', library: 'Rainy Library', night: 'Night Desk', cafe: 'Cozy Café' } as const;
export type SceneId = keyof typeof sceneLabels;
export type EnvironmentChoice = 'automatic' | SceneId;
export interface EnvironmentPreferences { selection: EnvironmentChoice; motion: boolean }
export const defaultEnvironment = (): EnvironmentPreferences => ({ selection: 'automatic', motion: true });
const choices = ['automatic', ...Object.keys(sceneLabels)] as EnvironmentChoice[];
export function parseEnvironment(raw: string | null): EnvironmentPreferences {
    try {
        const input: unknown = raw ? JSON.parse(raw) : null;
        if (!input || typeof input !== 'object' || Array.isArray(input)) return defaultEnvironment();
        const row = input as Record<string, unknown>;
        return { selection: choices.includes(row.selection as EnvironmentChoice) ? row.selection as EnvironmentChoice : 'automatic',
            motion: typeof row.motion === 'boolean' ? row.motion : true };
    } catch { return defaultEnvironment(); }
}
/** No weather inference. Rainy Library is a manual artistic choice. */
export function resolveEnvironment(selection: EnvironmentChoice, period: StudyPeriod): SceneId {
    return selection === 'automatic' ? ({ morning: 'cafe', afternoon: 'campus', night: 'night' } as const)[period] : selection;
}
export function environmentKey(userId: number) {
    if (!Number.isSafeInteger(userId) || userId <= 0) throw new Error('Invalid environment account.');
    return `studystreak:study-environment:v1:${userId}`;
}
/** Synchronous local storage: each store captures one account key, with no shared account cache. */
export function createEnvironmentStore(storage: { read(): string | null; write(value: string): void }) {
    let state = { preferences: defaultEnvironment(), ready: false, error: null as string | null };
    const listeners = new Set<() => void>();
    const publish = () => listeners.forEach(fn => fn());
    return {
        getSnapshot: () => state,
        subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; },
        hydrate() {
            try { state = { preferences: parseEnvironment(storage.read()), ready: true, error: null }; }
            catch { state = { ...state, ready: true, error: 'Environment could not be loaded. Defaults are shown.' }; }
            publish();
        },
        update(patch: Partial<EnvironmentPreferences>) {
            const preferences = parseEnvironment(JSON.stringify({ ...state.preferences, ...patch }));
            state = { preferences, ready: true, error: null };
            try { storage.write(JSON.stringify(preferences)); }
            catch { state = { ...state, error: 'Environment works for now, but could not be saved. Please retry.' }; }
            publish();
        },
    };
}
