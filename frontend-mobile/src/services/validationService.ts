import { apiClient } from './apiClient';
import type { Validation, ValidationRequest } from '../types/validation';

function path(goalId: number, recordId: number): string {
  return `/api/goals/${goalId}/daily-records/${recordId}/validation`;
}

export const validationService = {
  async get(goalId: number, recordId: number, signal?: AbortSignal): Promise<Validation> {
    const { data } = await apiClient.get<Validation>(path(goalId, recordId), { signal });
    return data;
  },

  async create(goalId: number, recordId: number, request: ValidationRequest): Promise<Validation> {
    const { data } = await apiClient.post<Validation>(path(goalId, recordId), request);
    return data;
  },

  async update(goalId: number, recordId: number, request: ValidationRequest): Promise<Validation> {
    const { data } = await apiClient.put<Validation>(path(goalId, recordId), request);
    return data;
  },
};
