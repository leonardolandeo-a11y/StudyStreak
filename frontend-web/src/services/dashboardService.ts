import apiClient from "./apiClient";
import type {
    GoalSummary,
    RecordSummary,
    StreakSummary,
    ValidationSummary
} from "../types/dashboard";

export async function getGoalSummary(signal?: AbortSignal): Promise<GoalSummary> {
    const response = await apiClient.get<GoalSummary>("/api/dashboard/goals", { signal });
    return response.data;
}

export async function getStreakSummary(signal?: AbortSignal): Promise<StreakSummary> {
    const response = await apiClient.get<StreakSummary>("/api/dashboard/streaks", { signal });
    return response.data;
}

export async function getRecordSummary(signal?: AbortSignal): Promise<RecordSummary> {
    const response = await apiClient.get<RecordSummary>("/api/dashboard/records", { signal });
    return response.data;
}

export async function getValidationSummary(signal?: AbortSignal): Promise<ValidationSummary> {
    const response = await apiClient.get<ValidationSummary>("/api/dashboard/validations", { signal });
    return response.data;
}
