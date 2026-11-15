import type { Presence } from "../../services/socialService";

export function PresenceDot({ presence }: { presence?: Presence | null }) {
    if (!presence || !['ONLINE', 'OFFLINE'].includes(presence.status)) return null;
    const online = presence.status === 'ONLINE';
    return <span role="img" aria-label={online ? 'Online' : 'Offline'} title={online ? 'Online' : 'Offline'} className={`absolute right-0 bottom-0 size-3 rounded-full border-2 border-surface ${online ? 'bg-success' : 'bg-content-muted'}`} />;
}
export function PresenceStatus({ presence, compact = false, emphasize = false }: { presence?: Presence | null; compact?: boolean; emphasize?: boolean }) {
    if (!presence) return null;
    const last = presence.lastSeenAt ? Date.parse(presence.lastSeenAt) : NaN;
    const now = Date.parse(presence.serverNow);
    const minutes = Number.isFinite(last) && Number.isFinite(now) ? Math.max(0, Math.floor((now - last) / 60000)) : null;
    const relative = minutes === null ? null : minutes < 1 ? 'just now' : new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(-Math.floor(minutes / (minutes >= 1440 ? 1440 : minutes >= 60 ? 60 : 1)), minutes >= 1440 ? 'day' : minutes >= 60 ? 'hour' : 'minute');
    return <div className={`flex flex-wrap gap-x-3 gap-y-1 text-content-muted ${compact ? "mt-0.5 text-xs" : "mt-2 text-sm"}`}>
        {['ONLINE', 'OFFLINE'].includes(presence.status) && <span data-presence-status={presence.status} className={emphasize ? `font-semibold ${presence.status === "ONLINE" ? "text-success" : "text-content-muted"}` : undefined}>{presence.status === 'ONLINE' ? 'Online' : 'Offline'}</span>}
        {relative && <time dateTime={presence.lastSeenAt!} title={new Date(last).toLocaleString()}>Last seen {relative}</time>}
    </div>;
}
export function JoinedDate({ date }: { date?: string | null }) {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    const value = new Date(`${date}T00:00:00Z`);
    if (!Number.isFinite(value.getTime())) return null;
    return <p className="mt-2 text-sm text-content-muted">Joined <time dateTime={date}>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' }).format(value)}</time></p>;
}
