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
export interface EnvironmentStorage { read(): Promise<string | null>; write(value: string): Promise<void> }
/** One account per store. The adapter serializes files across mounted routes. */
export function createEnvironmentStore(storage: EnvironmentStorage) {
    let state = { preferences: defaultEnvironment(), ready: false, error: null as string | null };
    let revision = 0, hydration = 0;
    const listeners = new Set<() => void>();
    const publish = () => listeners.forEach(fn => fn());
    return {
        getSnapshot: () => state,
        subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; },
        cancelHydration() { hydration++; },
        async hydrate() {
            const read = ++hydration, edit = revision;
            state = { ...state, ready: false }; publish();
            try {
                const raw = await storage.read();
                if (read !== hydration || edit !== revision) return;
                state = { preferences: parseEnvironment(raw), ready: true, error: null };
            } catch {
                if (read !== hydration || edit !== revision) return;
                state = { ...state, ready: true, error: 'Environment could not be loaded. Defaults are shown.' };
            }
            publish();
        },
        update(patch: Partial<EnvironmentPreferences>) {
            const edit = ++revision; hydration++;
            const preferences = parseEnvironment(JSON.stringify({ ...state.preferences, ...patch }));
            state = { preferences, ready: true, error: null }; publish();
            let write: Promise<void>;
            try { write = storage.write(JSON.stringify(preferences)); } catch { write = Promise.reject(new Error('Environment persistence unavailable.')); }
            return write.then(() => {
                if (revision === edit) { state = { ...state, error: null }; publish(); }
            }).catch(() => {
                if (revision === edit) { state = { ...state, error: 'Environment works for now, but could not be saved. Please retry.' }; publish(); }
            });
        },
    };
}
