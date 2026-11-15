import { apiClient } from './apiClient';
import { getSessionRevision } from './authSession';
const config = (signal?: AbortSignal) => ({ signal, _sessionRevision: getSessionRevision() });

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
  version?: number;
  members: StudyRoomMember[];
}
export const studyRoomService = {
  async list(signal?: AbortSignal): Promise<StudyRoom[]> {
    return (await apiClient.get<StudyRoom[]>('/api/study-rooms', config(signal))).data;
  },
  async create(name: string): Promise<StudyRoom> {
    return (await apiClient.post<StudyRoom>('/api/study-rooms', { name }, config())).data;
  },
  async join(code: string): Promise<StudyRoom> {
    return (await apiClient.post<StudyRoom>('/api/study-rooms/join', { code }, config())).data;
  },
  async get(id: string, signal?: AbortSignal): Promise<StudyRoom> {
    return (await apiClient.get<StudyRoom>(`/api/study-rooms/${id}`, config(signal))).data;
  },
  async heartbeat(id: string, studying: boolean | null): Promise<StudyRoom> {
    return (await apiClient.post<StudyRoom>(`/api/study-rooms/${id}/heartbeat`, { studying }, config())).data;
  },
  async timer(id: string, action: StudyRoomAction, expectedVersion?: number): Promise<StudyRoom> {
    return (await apiClient.post<StudyRoom>(`/api/study-rooms/${id}/timer`, { action, expectedVersion }, config())).data;
  },
  async regenerateCode(id: string): Promise<StudyRoom> {
    return (await apiClient.post<StudyRoom>(`/api/study-rooms/${id}/invitation`, undefined, config())).data;
  },
  async transferHost(id: string, userId: number): Promise<StudyRoom> {
    return (await apiClient.post<StudyRoom>(`/api/study-rooms/${id}/host`, { userId }, config())).data;
  },
  async leave(id: string): Promise<void> {
    await apiClient.delete(`/api/study-rooms/${id}`, config());
  },
};

export { sharedTimeRemaining, displayRoomTime } from './studyRoomClock';
