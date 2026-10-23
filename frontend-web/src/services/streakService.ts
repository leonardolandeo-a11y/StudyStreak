import apiClient from "./apiClient";

import type {
    Streak
} from "../types/streak";


export async function getGoalStreak(goalId: number, signal?: AbortSignal): Promise<Streak> {

    const response =await apiClient.get<Streak>(`/api/goals/${goalId}/streak`,
            {
                signal
            }
        );

    return response.data;
}