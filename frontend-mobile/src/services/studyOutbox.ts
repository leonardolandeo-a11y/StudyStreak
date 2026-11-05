export interface PendingCompletion { sessionId: string; goalId: number; durationMinutes: number; }
export interface OutboxStorage {
  keys(): Promise<string[]>;
  read(key: string): Promise<string | null>;
  write(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}
/** One durable key per UUID: another device/tab cannot replace the whole queue. */
export function createStudyOutbox(storage: OutboxStorage) {
  let writes: Promise<unknown> = Promise.resolve();
  const prefix = (user: number) => {
    if (!Number.isSafeInteger(user) || user <= 0) throw new Error('Invalid outbox account');
    return `study-outbox-v3-${user}--`;
  };
  const key = (user: number, id: string) => {
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error('Invalid session UUID');
    return `${prefix(user)}${id}.json`;
  };
  function serialize(operation: () => Promise<void>) {
    const next = writes.catch(() => {}).then(operation); writes = next; return next;
  }
  return {
    save(user: number, session: PendingCompletion) {
      return serialize(() => storage.write(key(user, session.sessionId), JSON.stringify(session)));
    },
    remove(user: number, id: string) { return serialize(() => storage.remove(key(user, id))); },
    async read(user: number): Promise<PendingCompletion[]> {
      await writes.catch(() => {});
      const keys = (await storage.keys()).filter(value => value.startsWith(prefix(user)) && value.endsWith('.json'));
      const items = await Promise.all(keys.map(async name => {
        const value = await storage.read(name);
        // Another tab may acknowledge and remove a key after keys() completed.
        if (value === null) return null;
        const item = JSON.parse(value) as PendingCompletion | null;
        if (!item || key(user, item.sessionId) !== name || !Number.isSafeInteger(item.goalId) || item.goalId <= 0 || !Number.isInteger(item.durationMinutes) || item.durationMinutes < 5 || item.durationMinutes > 120)
          throw new Error('A pending study record is damaged; it has not been deleted');
        return item;
      }));
      return items.filter((item): item is PendingCompletion => item !== null);
    },
  };
}
