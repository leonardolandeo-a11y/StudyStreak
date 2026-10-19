import type {Goal,GoalRequest} from "../types/goal";
import type { PageResponse } from "../types/page";
import apiClient from "./apiClient";


export async function getGoals(userId: number, page = 0, size = 10) : Promise<PageResponse<Goal>>{
    const response = await apiClient.get<PageResponse<Goal>>(`/users/${userId}/goals`,{
        params:{
            page,
            size
        }
    });
    return response.data;
}
export async function createGoal(userId: number, goal:GoalRequest): Promise<Goal>{
    const response = await apiClient.post<Goal>(`/users/${userId}/goals`, goal);
    return response.data;
}

export async function getGoal(userId: number , goalId:number):Promise<Goal>{
    const response = await apiClient.get<Goal>(`users/${userId}/goals/${goalId}`);
    return response.data;
}
export async function updateGoal(userId: number, goalId: number, goal:GoalRequest) : Promise<Goal>{
    const response = await apiClient.put<Goal>(`/users/${userId}/goals/${goalId}`,goal);
    return response.data;
}

export async function deleteGoal(userId: number, goalId:number): Promise<void>{
    await apiClient.delete(`/users/${userId}/goals/${goalId}`);
}