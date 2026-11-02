import { apiClient } from './apiClient';
import type { PageResponse } from '../types/page';
import type { UserSearchResult } from '../types/userSearch';

export const userSearchService = {
  async search(query: string, page: number, signal?: AbortSignal): Promise<PageResponse<UserSearchResult>> {
    const { data } = await apiClient.get<PageResponse<UserSearchResult>>('/users/search', {
      params: { query, page },
      signal,
    });
    return data;
  },
};
