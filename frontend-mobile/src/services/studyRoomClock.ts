import type { StudyRoom } from './studyRoomService';

export function sharedTimeRemaining(room: StudyRoom, receivedAt: number, now: number): number {
  if (room.timerStatus === 'COMPLETE') return 0;
  if (room.timerStatus !== 'RUNNING' || !room.endsAt) return room.remainingSeconds;
  const deadline = Date.parse(room.endsAt);
  const serverTime = Date.parse(room.serverNow);
  if (!Number.isFinite(deadline) || !Number.isFinite(serverTime)) return room.remainingSeconds;
  return Math.max(0, Math.ceil((deadline - serverTime - (now - receivedAt)) / 1000));
}
export function displayRoomTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}

/** Reject delayed poll/action responses after a newer server snapshot. */
export function isNewerRoom(current: StudyRoom, incoming: StudyRoom): boolean {
    if (current.id !== incoming.id) return false;
    if ((incoming.version ?? 0) !== (current.version ?? 0))
        return (incoming.version ?? 0) > (current.version ?? 0);
    return Date.parse(incoming.serverNow) >= Date.parse(current.serverNow);
}
