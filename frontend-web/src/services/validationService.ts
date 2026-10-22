import apiClient from "./apiClient";

import type{
    Validation,
    ValidationRequest
}from "../types/validation";

export async function createValidation(goalId:number, dailyRecordId:number, validation:ValidationRequest): Promise<Validation>{
    const response = await apiClient.post<Validation>(`/api/goals/${goalId}/daily-records/${dailyRecordId}/validation`,validation);

    return response.data;
}
export async function getValidation(goalId:number, dailyRecordId:number):Promise<Validation>{
    const response = await apiClient.get<Validation>(`/api/goals/${goalId}/daily-records/${dailyRecordId}/validation`);
    return response.data;
}

export async function updateValidation(goalId:number,dailyRecordId:number,validation:ValidationRequest) : Promise<Validation>{
    const response = await apiClient.put<Validation>(`/api/goals/${goalId}/daily-records/${dailyRecordId}/validation`,validation);
    return response.data;
}