import { apiClient } from './apiClient';
import { getSessionRevision } from './authSession';
import type { PageResponse } from '../types/page';
import { tagNameError, type Tag, type TagRequest } from '../types/tag';
function path(userId: number, goalId: number, tagId?: number) {
  if (![userId,goalId,...(tagId === undefined ? [] : [tagId])].every(id => Number.isSafeInteger(id) && id > 0)) throw new Error('Invalid tag address.');
  return `/users/${userId}/goals/${goalId}/tags${tagId === undefined ? '' : `/${tagId}`}`;
}
const config = (signal?: AbortSignal) => ({ signal, _sessionRevision: getSessionRevision() });
function body(value: TagRequest) { const error = tagNameError(value.name); if (error) throw new Error(error); return { name: value.name.trim() }; }
export const tagService = {
  async list(userId: number, goalId: number, page: number, signal?: AbortSignal): Promise<PageResponse<Tag>> {
    return (await apiClient.get(path(userId,goalId), { ...config(signal), params: { page, size: 10 } })).data;
  },
  async create(userId: number, goalId: number, value: TagRequest, signal?: AbortSignal): Promise<Tag> {
    return (await apiClient.post(path(userId,goalId), body(value), config(signal))).data;
  },
  async update(userId: number, goalId: number, tagId: number, value: TagRequest, signal?: AbortSignal): Promise<Tag> {
    return (await apiClient.patch(path(userId,goalId,tagId), body(value), config(signal))).data;
  },
  async remove(userId: number, goalId: number, tagId: number, signal?: AbortSignal): Promise<void> {
    await apiClient.delete(path(userId,goalId,tagId), config(signal));
  },
};
