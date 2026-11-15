export type ChatMessage = { id: string; authorId: number; authorName: string; text: string; createdAt: string; removed: boolean };
export type RoomPresence = { userId: number; handRaised: boolean; reaction: string | null };
export type ChatFeed = { messages: ChatMessage[]; totalPages: number; presence: RoomPresence[] };
export const roomReactions = ['👏', '💡', '✅'] as const;
/** Offset pages can overlap when live messages arrive. Tombstones never revive. */
export function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
    const rows = new Map(current.map(message => [message.id, message]));
    for (const message of incoming) if (!rows.get(message.id)?.removed || message.removed) rows.set(message.id, message);
    return [...rows.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
}
export function groupedMessage(previous: ChatMessage | undefined, message: ChatMessage) {
    const gap = previous ? Date.parse(message.createdAt) - Date.parse(previous.createdAt) : Infinity;
    return !!previous && !previous.removed && !message.removed && previous.authorId === message.authorId && gap >= 0 && gap < 300_000;
}
export function nearChatEnd(offset: number, viewport: number, content: number) { return content - viewport - offset < 80; }
/** Visual ratio only: durations are the existing server's fixed 25/5 minute phases. */
export function roomProgress(seconds: number, phase: 'FOCUS' | 'BREAK') { return Math.max(0, Math.min(1, seconds / (phase === 'FOCUS' ? 1500 : 300))); }
export interface CollaborationTransport {
    feed(page: number, signal: AbortSignal): Promise<ChatFeed>;
    send(message: { id: string; text: string }, signal: AbortSignal): Promise<ChatMessage | undefined>;
    action(path: string, body: unknown, method: 'post' | 'put' | 'delete', signal: AbortSignal): Promise<void>;
}
/** Per-room/account state; polling only refreshes page zero. Older pages are user requested. */
export function createCollaboration(transport: CollaborationTransport, uuid: () => string) {
    let state = { messages: [] as ChatMessage[], presence: [] as RoomPresence[], text: '', busy: false, loading: true,
        loadingEarlier: false, hasEarlier: false, loadError: null as string | null, historyError: null as string | null, actionError: null as string | null };
    let controller: AbortController | null = null, timer: ReturnType<typeof setInterval> | null = null;
    let generation = 0, nextPage = 1, pages = 0, refreshing = false;
    let pending: { id: string; text: string } | null = null;
    const listeners = new Set<() => void>();
    const patch = (value: Partial<typeof state>) => { state = { ...state, ...value }; listeners.forEach(fn => fn()); };
    const valid = (run: number) => run === generation && !!controller && !controller.signal.aborted;
    const unavailable = (error: unknown) => [403,404].includes((error as { response?: { status?: number } })?.response?.status ?? 0);
    // A denied feed invalidates all work issued under the previous room access.
    // Keep the same polling timer; the next read can revalidate membership.
    function invalidateAccess() {
        generation++; controller?.abort(); controller = new AbortController();
        nextPage = 1; pages = 0; refreshing = false;
        patch({ messages: [], presence: [], hasEarlier: false, busy: false, loading: false,
            loadingEarlier: false, historyError: null, actionError: null });
    }
    async function refresh() {
        if (!controller || refreshing) return;
        const run = generation, signal = controller.signal; refreshing = true;
        try {
            const feed = await transport.feed(0, signal);
            if (!valid(run)) return;
            pages = feed.totalPages;
            patch({ messages: mergeMessages(state.messages, feed.messages), presence: feed.presence, loading: false,
                hasEarlier: nextPage < pages, loadError: null });
        } catch (error) {
            if (valid(run)) {
                if (unavailable(error)) invalidateAccess();
                patch({ loading: false, loadError: 'Chat unavailable. Check connection and room membership.' });
            }
        } finally { if (valid(run)) refreshing = false; }
    }
    async function loadEarlier() {
        if (!controller || state.loadingEarlier || !state.hasEarlier) return;
        const run = generation, signal = controller.signal, page = nextPage;
        patch({ loadingEarlier: true, historyError: null });
        try {
            const feed = await transport.feed(page, signal);
            if (!valid(run)) return;
            nextPage = page + 1; pages = feed.totalPages;
            patch({ messages: mergeMessages(state.messages, feed.messages), hasEarlier: nextPage < pages });
        } catch (error) {
            if (valid(run)) {
                if (unavailable(error)) invalidateAccess();
                patch({ historyError: 'Earlier messages could not be loaded. Scroll up or retry.' });
            }
        } finally { if (valid(run)) patch({ loadingEarlier: false }); }
    }
    async function action(path: string, body?: unknown, method: 'post' | 'put' | 'delete' = 'post') {
        if (!controller || state.busy) return;
        const run = generation, signal = controller.signal;
        patch({ busy: true, actionError: null });
        try {
            await transport.action(path, body, method, signal);
            if (!valid(run)) return;
            if (method === 'delete') patch({ messages: state.messages.map(message => path === `/messages/${message.id}` ? { ...message, removed: true, text: 'Message removed by host' } : message) });
            await refresh();
        } catch { if (valid(run)) patch({ actionError: 'Action failed. Check membership or wait a moment before retrying.' }); }
        finally { if (valid(run)) patch({ busy: false }); }
    }
    async function send() {
        const text = state.text.trim();
        if (!controller || state.busy || !text || text.length > 1000) return;
        const run = generation, signal = controller.signal;
        if (!pending || pending.text !== text) pending = { id: uuid(), text };
        patch({ busy: true, actionError: null });
        try {
            const confirmed = await transport.send(pending, signal);
            if (!valid(run)) return;
            pending = null;
            patch({ text: state.text.trim() === text ? '' : state.text, ...(confirmed?.id ? { messages: mergeMessages(state.messages, [confirmed]) } : {}) });
            await refresh();
        } catch { if (valid(run)) patch({ actionError: 'Message not confirmed. Retry keeps the same message ID to avoid duplicates.' }); }
        finally { if (valid(run)) patch({ busy: false }); }
    }
    function stop() {
        generation++; controller?.abort(); controller = null; refreshing = false;
        if (timer) clearInterval(timer); timer = null;
        patch({ busy: false, loadingEarlier: false });
    }
    function start() {
        if (controller) return;
        controller = new AbortController(); void refresh(); timer = setInterval(() => void refresh(), 2500);
    }
    return { getSnapshot: () => state, subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; },
        start, stop, retry: refresh, loadEarlier, action, send, setText: (text: string) => patch({ text }) };
}
