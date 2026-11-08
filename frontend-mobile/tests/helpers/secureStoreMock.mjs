export const persisted = new Map();
let writeBarrier = null;
export function blockNextWrite(barrier) { writeBarrier = barrier; }
export async function getItemAsync(key) { return persisted.get(key) ?? null; }
export async function setItemAsync(key, value) {
  if (writeBarrier) {
    const barrier = writeBarrier;
    writeBarrier = null;
    barrier.started.resolve();
    await barrier.finish.promise;
  }
  persisted.set(key, value);
}
export async function deleteItemAsync(key) { persisted.delete(key); }
