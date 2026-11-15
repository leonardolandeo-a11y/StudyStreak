// One counter per authenticated navigation scope. A mutation refresh supersedes
// an older poll so it cannot restore a stale badge after reading/deleting.
export function createUnreadCounter(load: (signal: AbortSignal) => Promise<number>, publish: (count: number) => void) {
  let disposed = false;
  let current: { controller: AbortController; task: Promise<void> } | null = null;
  function refresh(force = false): Promise<void> {
    if (disposed) return Promise.resolve();
    if (current && !force) return current.task;
    current?.controller.abort();
    const controller = new AbortController();
    const task = Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      try {
        const count = await load(controller.signal);
        if (!disposed && !controller.signal.aborted) publish(count);
      } catch { /* Keep the last confirmed count on network failures. */ }
      finally { if (current?.controller === controller) current = null; }
    });
    current = { controller, task };
    return task;
  }
  return { refresh, cancel() { current?.controller.abort(); current = null; }, dispose() { disposed = true; current?.controller.abort(); current = null; } };
}
