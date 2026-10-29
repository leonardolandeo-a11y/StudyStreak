import { apiClient } from './apiClient';
import type { Notification, NotificationType } from '../types/notification';
import type { PageResponse } from '../types/page';

const base = (userId: number) => `/users/${userId}/notifications`;

export const notificationService = {
  async list(userId: number, page = 0, signal?: AbortSignal): Promise<PageResponse<Notification>> {
    const response = await apiClient.get<PageResponse<Notification>>(base(userId), {
      params: { page, size: 10 },
      signal,
    });
    return response.data;
  },
  async unread(userId: number, page = 0, signal?: AbortSignal): Promise<PageResponse<Notification>> {
    const response = await apiClient.get<PageResponse<Notification>>(`${base(userId)}/unread`, {
      params: { page, size: 10 },
      signal,
    });
    return response.data;
  },
  async byType(userId: number, type: NotificationType, page = 0, signal?: AbortSignal): Promise<PageResponse<Notification>> {
    const response = await apiClient.get<PageResponse<Notification>>(`${base(userId)}/type/${type}`, {
      params: { page, size: 10 },
      signal,
    });
    return response.data;
  },
  async countUnread(userId: number, signal?: AbortSignal): Promise<number> {
    const response = await apiClient.get<PageResponse<Notification>>(`${base(userId)}/unread`, {
      params: { page: 0, size: 1 },
      signal,
    });
    return response.data.totalElements;
  },
  async markRead(userId: number, id: number): Promise<Notification> {
    const response = await apiClient.patch<Notification>(`${base(userId)}/${id}/read`);
    return response.data;
  },
  async remove(userId: number, id: number): Promise<void> {
    await apiClient.delete(`${base(userId)}/${id}`);
  },
};
