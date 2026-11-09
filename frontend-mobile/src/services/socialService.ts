import { apiClient } from './apiClient';
import { getSessionRevision } from './authSession';
import type { TrackingLink } from '../types/trackingLink';
import type { PageResponse } from '../types/page';
export interface Presence { status: 'ONLINE' | 'OFFLINE' | 'HIDDEN'; lastSeenAt: string | null; serverNow: string; }
export interface SocialPrivacy { showPresence: boolean; showLastSeen: boolean; shareVerifiedMinutes: boolean; shareVerifiedSessions: boolean; }
export interface SocialProfile {
  id: number; username: string; presentationName: string; bio: string | null; registrationDate: string | null;
  statistics: { verifiedMinutes?: number; verifiedSessions?: number }; presence: Presence | null;
}
const config = (signal: AbortSignal, revision: number) => ({ signal, _sessionRevision: revision });
export const socialService = {
  async privacy(signal: AbortSignal, revision = getSessionRevision()): Promise<SocialPrivacy> {
    return (await apiClient.get('/api/profile/privacy', config(signal, revision))).data;
  },
  async savePrivacy(value: SocialPrivacy, signal: AbortSignal, revision = getSessionRevision()): Promise<SocialPrivacy> {
    return (await apiClient.put('/api/profile/privacy', value, config(signal, revision))).data;
  },
  async heartbeat(sessionId: string, signal: AbortSignal, revision = getSessionRevision()): Promise<Presence> {
    return (await apiClient.post('/api/presence/heartbeat', { sessionId }, config(signal, revision))).data;
  },
  async profile(id: number, signal: AbortSignal, revision = getSessionRevision()): Promise<SocialProfile> {
    return (await apiClient.get(`/api/users/${id}/profile`, config(signal, revision))).data;
  },
  async presence(id: number, signal: AbortSignal, revision = getSessionRevision()): Promise<Presence> {
    return (await apiClient.get(`/api/users/${id}/presence`, config(signal, revision))).data;
  },
  async activePage(page: number, signal: AbortSignal, revision = getSessionRevision()): Promise<PageResponse<TrackingLink>> {
    return (await apiClient.get('/api/tracking-links/active', { ...config(signal, revision), params: { page, size: 10 } })).data;
  },
  async accepted(ownerId: number, signal: AbortSignal, revision = getSessionRevision()): Promise<Set<number>> {
    const ids = new Set<number>();
    for (let page = 0; ; page++) {
      const result = (await apiClient.get<PageResponse<TrackingLink>>('/api/tracking-links/active', {
        ...config(signal, revision), params: { page, size: 10 },
      })).data;
      if (!Array.isArray(result.content) || !Number.isSafeInteger(result.totalPages) || result.totalPages < 0) throw new Error('Invalid Tracking response.');
      for (const link of result.content) {
        if (link.status !== 'ACCEPTED') continue;
        const id = link.requesterId === ownerId ? link.receiverId : link.receiverId === ownerId ? link.requesterId : null;
        if (id !== null && Number.isSafeInteger(id) && id > 0 && id !== ownerId) ids.add(id);
      }
      if (page + 1 >= result.totalPages) return ids;
    }
  },
};
