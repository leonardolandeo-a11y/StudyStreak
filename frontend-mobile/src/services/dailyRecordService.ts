import { apiClient } from './apiClient';
import type { DailyRecord, DailyRecordRequest } from '../types/dailyRecord';
import type { PageResponse } from '../types/page';

export const dailyRecordService = {
  async list(goalId: number, page: number, signal?: AbortSignal): Promise<PageResponse<DailyRecord>> {
    const { data } = await apiClient.get<PageResponse<DailyRecord>>(`/api/goals/${goalId}/daily-records`, {
      params: { page, size: 10 },
      signal,
    });
    return data;
  },

  async create(goalId: number, request: DailyRecordRequest): Promise<DailyRecord> {
    const { data } = await apiClient.post<DailyRecord>(`/api/goals/${goalId}/daily-records`, request);
    return data;
  },

  async update(goalId: number, recordId: number, request: DailyRecordRequest): Promise<DailyRecord> {
    const { data } = await apiClient.put<DailyRecord>(`/api/goals/${goalId}/daily-records/${recordId}`, request);
    return data;
  },

  async remove(goalId: number, recordId: number): Promise<void> {
    await apiClient.delete(`/api/goals/${goalId}/daily-records/${recordId}`);
  },
};
