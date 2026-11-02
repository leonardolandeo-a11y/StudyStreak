import { apiClient } from './apiClient';
import type { TrackingDecision, TrackingLink } from '../types/trackingLink';
import type { PageResponse } from '../types/page';

async function list(path: string, page: number, signal?: AbortSignal): Promise<PageResponse<TrackingLink>> {
  const { data } = await apiClient.get<PageResponse<TrackingLink>>(path, {
    params: { page, size: 10 },
    signal,
  });
  return data;
}

export const trackingLinkService = {
  all(page: number, signal?: AbortSignal) {
    return list('/api/tracking-links', page, signal);
  },

  pending(page: number, signal?: AbortSignal) {
    return list('/api/tracking-links/pending', page, signal);
  },

  active(page: number, signal?: AbortSignal) {
    return list('/api/tracking-links/active', page, signal);
  },

  async request(receiverId: number): Promise<TrackingLink> {
    const { data } = await apiClient.post<TrackingLink>(`/api/tracking-links/${receiverId}`);
    return data;
  },

  async respond(linkId: number, status: TrackingDecision): Promise<TrackingLink> {
    const { data } = await apiClient.patch<TrackingLink>(`/api/tracking-links/${linkId}/status`, { status });
    return data;
  },

  async remove(linkId: number): Promise<void> {
    await apiClient.delete(`/api/tracking-links/${linkId}`);
  },
};
