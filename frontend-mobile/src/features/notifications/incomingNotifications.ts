import type { Notification } from '../../types/notification';
/** Initial history is silent. Only unseen, unread server rows beyond the watermark can alert. */
export function createNotificationCursor(clock = Date.now) {
  let ready = false, time = -Infinity, id = 0;
  const seen = new Set<number>();
  return { observe(rows: Notification[]) {
    const valid = rows.filter(row => Number.isSafeInteger(row.id) && row.id > 0 && typeof row.message === 'string' && typeof row.type === 'string' && typeof row.read === 'boolean' && Number.isFinite(Date.parse(row.createdAt)));
    const fresh = ready ? valid.filter(row => !row.read && !seen.has(row.id) && (Date.parse(row.createdAt) > time || (Date.parse(row.createdAt) === time && row.id > id))) : [];
    if (!ready && !valid.length) time = Math.floor(clock()/1000)*1000-1;
    for (const row of valid) {
      const stamp = Date.parse(row.createdAt);
      if (stamp > time) { time = stamp; id = row.id; } else if (stamp === time) id = Math.max(id,row.id);
      seen.add(row.id);
    }
    while (seen.size > 2048) seen.delete(seen.values().next().value!);
    ready = true;
    return [...new Map(fresh.map(row => [row.id,row])).values()].sort((a,b) => Date.parse(a.createdAt)-Date.parse(b.createdAt) || a.id-b.id);
  } };
}
export function appendNotificationPopups(current: Notification[], fresh: Notification[]) {
  return [...new Map([...current,...fresh].map(row => [row.id,row])).values()].slice(-3);
}
