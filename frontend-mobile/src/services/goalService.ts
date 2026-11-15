import { confirmGoalWrite, validateGoalDifficulty } from '../utils/goalWrite';
import { apiClient } from './apiClient';
import type { Goal, GoalRequest } from '../types/goal';
import type { PageResponse } from '../types/page';

export const goalService = {
  async list(userId: number, page: number, signal?: AbortSignal): Promise<PageResponse<Goal>> {
    const { data } = await apiClient.get<PageResponse<Goal>>(`/users/${userId}/goals`, {
      params: { page, size: 10 },
      signal,
    });
    data.content.forEach(validateGoalDifficulty);
    return data;
  },

  async get(userId: number, goalId: number, signal?: AbortSignal): Promise<Goal> {
    const { data } = await apiClient.get<Goal>(`/users/${userId}/goals/${goalId}`, { signal });
    return validateGoalDifficulty(data);
  },

  async create(userId: number, request: GoalRequest): Promise<Goal> {
    const { data } = await apiClient.post<Goal>(`/users/${userId}/goals`, request);
    return confirmGoalWrite(data, request, async id => {
      const response = await apiClient.get<Goal>(`/users/${userId}/goals/${id}`);
      return response.data;
    });
  },

  async update(userId: number, goalId: number, request: GoalRequest): Promise<Goal> {
    const { data } = await apiClient.put<Goal>(`/users/${userId}/goals/${goalId}`, request);
    return confirmGoalWrite(data, request, async id => {
      const response = await apiClient.get<Goal>(`/users/${userId}/goals/${id}`);
      return response.data;
    });
  },

  async remove(userId: number, goalId: number): Promise<void> {
    await apiClient.delete(`/users/${userId}/goals/${goalId}`);
  },
};
