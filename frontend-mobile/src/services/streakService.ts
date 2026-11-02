import { apiClient } from './apiClient';
import type { Streak } from '../types/streak';

export const streakService = {
  async get(goalId: number, signal?: AbortSignal): Promise<Streak> {
    const response = await apiClient.get<Streak>(`/api/goals/${goalId}/streak`, { signal });
    return response.data;
  },
};
