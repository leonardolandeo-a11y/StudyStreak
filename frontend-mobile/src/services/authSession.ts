type SessionExpiredListener = () => void;

const listeners = new Set<SessionExpiredListener>();
let sessionRevision = 0;

export function getSessionRevision(): number {
  return sessionRevision;
}

export function beginSessionChange(): number {
  return ++sessionRevision;
}

export function assertSessionRevision(revision: number): void {
  if (revision !== sessionRevision) throw new Error('Authentication session changed.');
}

export function isSessionRejection(status: number | undefined): boolean {
  return status === 400 || status === 401 || status === 403;
}

export function subscribeToSessionExpiration(listener: SessionExpiredListener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function notifySessionExpired(): void {
  for (const listener of listeners) listener();
}
