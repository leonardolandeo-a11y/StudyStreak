import { apiClient } from '../services/apiClient';
import type { Goal } from '../types/goal';
import type { PageResponse } from '../types/page';
import type { CompletedFocusSession } from './pomodoroState';

export interface FocusSummary {
  goalId: number;
  totalMinutes: number;
  completedSessions: number;
}

/** Lists all active owned Goals, including results beyond the initial page. */
export async function listActiveFocusGoals(
  userId: number, signal?: AbortSignal
): Promise<Goal[]> {
  const active: Goal[] = [];
  let page = 0;
  while (true) {
    const response = await apiClient.get<PageResponse<Goal>>(`/users/${userId}/goals`, {
      params: { page, size: 100 },
      signal,
    });
    active.push(...response.data.content.filter(goal => !goal.completed));
    page++;
    if (response.data.last || page >= response.data.totalPages ||
        response.data.content.length === 0) break;
  }
  return active;
}

/** Same idempotent endpoint used by the Web Focus Studio. */
export async function recordMobileFocusCompletion(
  completion: CompletedFocusSession
): Promise<void> {
  await apiClient.post(`/api/goals/${completion.goalId}/focus-sessions`, {
    sessionId: completion.sessionId,
    durationMinutes: completion.durationMinutes,
  });
}

export async function getMobileFocusSummary(
  goalId: number, signal?: AbortSignal
): Promise<FocusSummary> {
  const response = await apiClient.get<FocusSummary>(
    `/api/goals/${goalId}/focus-sessions/summary`, { signal },
  );
  return response.data;
}
