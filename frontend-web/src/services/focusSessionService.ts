import apiClient from "./apiClient";

export interface FocusSummary {
    goalId: number;
    totalMinutes: number;
    completedSessions: number;
}

export interface FocusCompletion {
    sessionId: string;
    goalId: number;
    durationMinutes: number;
}

export async function recordFocusCompletion(
    completion: FocusCompletion
): Promise<void> {
    await apiClient.post(`/api/goals/${completion.goalId}/focus-sessions`, {
        sessionId: completion.sessionId,
        durationMinutes: completion.durationMinutes
    });
}

export async function getFocusSummary(
    goalId: number, signal?: AbortSignal
): Promise<FocusSummary> {
    const response = await apiClient.get<FocusSummary>(
        `/api/goals/${goalId}/focus-sessions/summary`, { signal }
    );
    return response.data;
}
