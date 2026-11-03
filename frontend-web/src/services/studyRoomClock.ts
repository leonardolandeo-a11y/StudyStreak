import type { StudyRoom } from './studyRoomService';

export function sharedTimeRemaining(room: StudyRoom, receivedAt: number, now: number): number {
    if (room.timerStatus === "COMPLETE") return 0;
    if (room.timerStatus !== "RUNNING" || !room.endsAt) return room.remainingSeconds;
    const deadline = Date.parse(room.endsAt);
    const serverTime = Date.parse(room.serverNow);
    if (!Number.isFinite(deadline) || !Number.isFinite(serverTime)) return room.remainingSeconds;
    return Math.max(0, Math.ceil((deadline - serverTime - (now - receivedAt)) / 1000));
}

export function displayRoomTime(seconds: number): string {
    const safe = Math.max(0, Math.floor(seconds));
    return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}
