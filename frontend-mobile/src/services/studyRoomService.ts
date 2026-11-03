import { apiClient } from './apiClient';

export type StudyRoomAction = 'START' | 'PAUSE' | 'RESET' | 'FOCUS' | 'BREAK';
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
  phase: 'FOCUS' | 'BREAK';
  timerStatus: 'RUNNING' | 'PAUSED' | 'COMPLETE';
  remainingSeconds: number;
  endsAt: string | null;
  serverNow: string;
  members: StudyRoomMember[];
}
export const studyRoomService = {
  async list(signal?: AbortSignal): Promise<StudyRoom[]> {
    return (await apiClient.get<StudyRoom[]>('/api/study-rooms', { signal })).data;
  },
  async create(name: string): Promise<StudyRoom> {
    return (await apiClient.post<StudyRoom>('/api/study-rooms', { name })).data;
  },
  async join(code: string): Promise<StudyRoom> {
    return (await apiClient.post<StudyRoom>('/api/study-rooms/join', { code })).data;
  },
  async get(id: string, signal?: AbortSignal): Promise<StudyRoom> {
    return (await apiClient.get<StudyRoom>(`/api/study-rooms/${id}`, { signal })).data;
  },
  async heartbeat(id: string, studying: boolean): Promise<StudyRoom> {
    return (await apiClient.post<StudyRoom>(`/api/study-rooms/${id}/heartbeat`, { studying })).data;
  },
  async timer(id: string, action: StudyRoomAction): Promise<StudyRoom> {
    return (await apiClient.post<StudyRoom>(`/api/study-rooms/${id}/timer`, { action })).data;
  },
  async leave(id: string): Promise<void> {
    await apiClient.delete(`/api/study-rooms/${id}`);
  },
};

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
