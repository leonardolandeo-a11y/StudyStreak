import apiClient from "./apiClient";

export interface DailyFocus {
    date: string;
    minutes: number;
    sessions: number;
}
export interface GoalFocus {
    goalId: number;
    topic: string;
    minutes: number;
    sessions: number;
}
export interface FocusStatistics {
    days: number;
    totalMinutes: number;
    completedSessions: number;
    periodMinutes: number;
    periodSessions: number;
    bestDayMinutes: number;
    daily: DailyFocus[];
    byGoal: GoalFocus[];
}

export async function fetchFocusStatistics(days: 7 | 30, signal?: AbortSignal): Promise<FocusStatistics> {
    const response = await apiClient.get<FocusStatistics>("/api/focus-sessions/stats", {
        params: { days }, signal
    });
    return response.data;
}

export function focusDuration(minutes: number): string {
    const value = Math.max(0, Math.round(minutes));
    return value < 60 ? `${value}m` : `${Math.floor(value / 60)}h ${value % 60}m`;
}
