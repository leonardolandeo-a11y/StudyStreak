import apiClient from "./apiClient";

export interface DashboardSession {
    id: string;
    goal_name: string;
    source: "INDIVIDUAL" | "GROUP" | "LEGACY";
    state: "RUNNING" | "PAUSED" | "COMPLETE" | "CANCELLED";
    confirmed_seconds: number;
    started_at: string;
    verified: boolean;
}

/** Preview by start date, never a source for the completion-date chart. */
export async function getRecentStudySessions(from: string, to: string, signal: AbortSignal): Promise<DashboardSession[]> {
    const response = await apiClient.get<{ content: DashboardSession[] }>("/api/study/history", { params: { from, to, page: 0 }, signal });
    return response.data.content.slice(0, 4);
}
