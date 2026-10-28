import { apiClient } from './apiClient';
import type { Goal, GoalRequest } from '../types/goal';
import type { PageResponse } from '../types/page';

export const goalService = {
  async list(userId: number, page: number, signal?: AbortSignal): Promise<PageResponse<Goal>> {
    const { data } = await apiClient.get<PageResponse<Goal>>(`/users/${userId}/goals`, {
      params: { page, size: 10 },
      signal,
    });
    return data;
  },

  async get(userId: number, goalId: number, signal?: AbortSignal): Promise<Goal> {
    const { data } = await apiClient.get<Goal>(`/users/${userId}/goals/${goalId}`, { signal });
    return data;
  },

  async create(userId: number, request: GoalRequest): Promise<Goal> {
    const { data } = await apiClient.post<Goal>(`/users/${userId}/goals`, request);
    return data;
  },

  async update(userId: number, goalId: number, request: GoalRequest): Promise<Goal> {
    const { data } = await apiClient.put<Goal>(`/users/${userId}/goals/${goalId}`, request);
    return data;
  },

  async remove(userId: number, goalId: number): Promise<void> {
    await apiClient.delete(`/users/${userId}/goals/${goalId}`);
  },
};
