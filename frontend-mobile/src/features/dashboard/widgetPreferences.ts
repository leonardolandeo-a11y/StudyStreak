export const widgetLabels = {
    'focus-summary': 'Focus Summary', streak: 'Study Streak', activity: 'Study Activity', goals: 'Active Goals',
    journey: 'Study Journey', recent: 'Recent Activity', partners: 'Study Partners', quick: 'Quick Focus', calendar: 'Activity Calendar',
} as const;
export type WidgetId = keyof typeof widgetLabels;
export interface WidgetSetting { id: WidgetId; visible: boolean }
const ids = Object.keys(widgetLabels) as WidgetId[];
const defaultOrder: WidgetId[] = ['activity', ...ids.filter(id => id !== 'activity')];
export const defaultWidgets = (): WidgetSetting[] => defaultOrder.map(id => ({ id, visible: true }));
// Only an exact, fully visible historical default is safe to migrate.
function isLegacyDefault(input: unknown): boolean {
    return Array.isArray(input) && (input.length === 8 || input.length === 9) &&
        input[0]?.layoutVersion !== 2 && input.every((row,index) => row?.id === ids[index] && row?.visible === true);
}
/** Keep the array contract; mark new explicit choices so a deliberate old order survives reload. */
function serializeWidgets(rows: WidgetSetting[]) {
    return JSON.stringify(rows.map((row,index) => index === 0 ? { ...row, layoutVersion: 2 } : row));
}
/** Accept older partial arrays, discard unknown fields/IDs and keep each ID exactly once. */
export function parseWidgets(raw: string | null, migrateLegacy = true): WidgetSetting[] {
    try {
        const input: unknown = raw ? JSON.parse(raw) : null;
        if (!Array.isArray(input)) return defaultWidgets();
        if (migrateLegacy && isLegacyDefault(input)) return defaultWidgets();
        const seen = new Set<WidgetId>();
        const rows: WidgetSetting[] = [];
        for (const row of input) {
            if (!row || typeof row !== 'object' || typeof row.id !== 'string' || !ids.includes(row.id as WidgetId) || seen.has(row.id as WidgetId)) continue;
            const id = row.id as WidgetId; seen.add(id);
            rows.push({ id, visible: typeof row.visible === 'boolean' ? row.visible : true });
        }
        return [...rows, ...defaultWidgets().filter(row => !seen.has(row.id)).map(row => row.id === 'calendar' ? { ...row, visible: false } : row)];
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
            try {
                const raw = await storage.read();
                if (edits === revision) {
                    const rows = parseWidgets(raw);
                    state = { rows, ready: true, error: null };
                    let migrating = false;
                    try { migrating = raw !== null && isLegacyDefault(JSON.parse(raw)); } catch { /* Invalid input already uses defaults. */ }
                    if (migrating) {
                        task = task.catch(() => {}).then(async () => {
                            if (edits === revision) await storage.write(serializeWidgets(rows));
                        }).catch(() => {
                            if (edits === revision) state = { ...state, error: 'Layout works for now, but could not be saved. Please retry.' };
                        });
                        await task;
                    }
                }
            }
            catch { if (edits === revision) state = { ...state, ready: true, error: 'Layout could not be loaded. Defaults are shown.' }; }
            publish();
        },
        save(rows: WidgetSetting[]) {
            const revision = ++edits;
            const clean = parseWidgets(JSON.stringify(rows), false);
            state = { rows: clean, ready: true, error: null }; publish();
            task = task.catch(() => {}).then(() => storage.write(serializeWidgets(clean))).then(() => {
                if (edits === revision) { state = { ...state, error: null }; publish(); }
            }).catch(() => {
                if (edits === revision) { state = { ...state, error: 'Layout works for now, but could not be saved. Please retry.' }; publish(); }
            });
            return task;
        },
    };
}
