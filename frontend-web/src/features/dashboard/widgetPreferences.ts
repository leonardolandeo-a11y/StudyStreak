export const widgetLabels = {
    'focus-summary': 'Focus Summary', streak: 'Study Streak', activity: 'Study Activity', goals: 'Active Goals',
    journey: 'Study Journey', recent: 'Recent Activity', partners: 'Study Partners', quick: 'Quick Focus',
} as const;
export type WidgetId = keyof typeof widgetLabels;
export interface WidgetSetting { id: WidgetId; visible: boolean }
const ids = Object.keys(widgetLabels) as WidgetId[];
export const defaultWidgets = (): WidgetSetting[] => ids.map(id => ({ id, visible: true }));
/** Accept older partial arrays, discard unknown fields/IDs and keep each ID exactly once. */
export function parseWidgets(raw: string | null): WidgetSetting[] {
    try {
        const input: unknown = raw ? JSON.parse(raw) : null;
        if (!Array.isArray(input)) return defaultWidgets();
        const seen = new Set<WidgetId>();
        const rows: WidgetSetting[] = [];
        for (const row of input) {
            if (!row || typeof row !== 'object' || typeof row.id !== 'string' || !ids.includes(row.id as WidgetId) || seen.has(row.id as WidgetId)) continue;
            const id = row.id as WidgetId; seen.add(id);
            rows.push({ id, visible: typeof row.visible === 'boolean' ? row.visible : true });
        }
        return [...rows, ...defaultWidgets().filter(row => !seen.has(row.id))];
    } catch { return defaultWidgets(); }
}
export function moveWidget(rows: WidgetSetting[], id: WidgetId, direction: -1 | 1) {
    const from = rows.findIndex(row => row.id === id), to = from + direction;
    if (from < 0 || to < 0 || to >= rows.length) return rows;
    const next = [...rows]; [next[from], next[to]] = [next[to], next[from]]; return next;
}
export function widgetKey(userId: number) {
    if (!Number.isSafeInteger(userId) || userId <= 0) throw new Error('Invalid dashboard account.');
    return `studystreak-dashboard-v1-${userId}`;
}
/** One store per keyed account. Serialize writes and ignore late hydration after an edit. */
export function createWidgetStore(storage: { read(): Promise<string | null>; write(value: string): Promise<void> }) {
    let state = { rows: defaultWidgets(), ready: false, error: null as string | null };
    let edits = 0, task = Promise.resolve();
    const listeners = new Set<() => void>();
    const publish = () => listeners.forEach(fn => fn());
    return {
        getSnapshot: () => state,
        subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; },
        async hydrate() {
            const revision = edits;
            try { const raw = await storage.read(); if (edits === revision) state = { rows: parseWidgets(raw), ready: true, error: null }; }
            catch { if (edits === revision) state = { ...state, ready: true, error: 'Layout could not be loaded. Defaults are shown.' }; }
            publish();
        },
        save(rows: WidgetSetting[]) {
            const revision = ++edits;
            const clean = parseWidgets(JSON.stringify(rows));
            state = { rows: clean, ready: true, error: null }; publish();
            task = task.catch(() => {}).then(() => storage.write(JSON.stringify(clean))).then(() => {
                if (edits === revision) { state = { ...state, error: null }; publish(); }
            }).catch(() => {
                if (edits === revision) { state = { ...state, error: 'Layout works for now, but could not be saved. Please retry.' }; publish(); }
            });
            return task;
        },
    };
}
