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

export { sharedTimeRemaining, displayRoomTime } from './studyRoomClock';
