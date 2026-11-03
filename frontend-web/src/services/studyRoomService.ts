import apiClient from "./apiClient";

export type StudyRoomAction = "START" | "PAUSE" | "RESET" | "FOCUS" | "BREAK";

export interface StudyRoomMember {
    userId: number;
    username: string;
    online: boolean;
    studying: boolean;
    host: boolean;
}

export interface StudyRoom {
    id: string;
    name: string;
    inviteCode: string;
    ownerId: number;
    host: boolean;
    phase: "FOCUS" | "BREAK";
    timerStatus: "RUNNING" | "PAUSED" | "COMPLETE";
    remainingSeconds: number;
    endsAt: string | null;
    serverNow: string;
  version?: number;
    members: StudyRoomMember[];
}

export async function listStudyRooms(signal?: AbortSignal): Promise<StudyRoom[]> {
    return (await apiClient.get<StudyRoom[]>("/api/study-rooms", { signal })).data;
}

export async function createStudyRoom(name: string): Promise<StudyRoom> {
    return (await apiClient.post<StudyRoom>("/api/study-rooms", { name })).data;
}

export async function joinStudyRoom(code: string): Promise<StudyRoom> {
    return (await apiClient.post<StudyRoom>("/api/study-rooms/join", { code })).data;
}

export async function getStudyRoom(id: string, signal?: AbortSignal): Promise<StudyRoom> {
    return (await apiClient.get<StudyRoom>(`/api/study-rooms/${id}`, { signal })).data;
}

export async function heartbeatStudyRoom(id: string, studying: boolean | null): Promise<StudyRoom> {
    return (await apiClient.post<StudyRoom>(`/api/study-rooms/${id}/heartbeat`, { studying })).data;
}

export async function controlStudyRoom(id: string, action: StudyRoomAction, expectedVersion?: number): Promise<StudyRoom> {
    return (await apiClient.post<StudyRoom>(`/api/study-rooms/${id}/timer`, { action, expectedVersion })).data;
}

export async function leaveStudyRoom(id: string): Promise<void> {
    await apiClient.delete(`/api/study-rooms/${id}`);
}

/** Use the server's clock offset; device clocks can differ by minutes. */
export { sharedTimeRemaining, displayRoomTime } from './studyRoomClock';

export async function regenerateStudyRoomCode(id: string): Promise<StudyRoom> {
    return (await apiClient.post<StudyRoom>(`/api/study-rooms/${id}/invitation`)).data;
}
export async function transferStudyRoomHost(id: string, userId: number): Promise<StudyRoom> {
    return (await apiClient.post<StudyRoom>(`/api/study-rooms/${id}/host`, { userId })).data;
}
