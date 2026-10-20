import apiClient from "./apiClient";

import type {
    DailyRecord,
    DailyRecordRequest
} from "../types/dailyRecord";

import type {
    PageResponse
} from "../types/page";


export async function getDailyRecords(goalId:number, page = 0, size = 10): Promise<PageResponse<DailyRecord>>{

    const response = await apiClient.get<PageResponse<DailyRecord>>(`/api/goals/${goalId}/daily-records`, {
        params:{
            page,
            size
        }
    });
    return response.data;
}

export async function createDailyRecord(goalId:number, dailyRecord:DailyRecordRequest) : Promise<DailyRecord>{

    const response = await apiClient.post<DailyRecord>(`/api/goals/${goalId}/daily-records`,dailyRecord);

    return response.data;
}

export async function getDailyRecord(goalId:number, dailyRecordId:number):Promise<DailyRecord>{

    const response = await apiClient.get<DailyRecord>(`/api/goals/${goalId}/daily-records/${dailyRecordId}`);

    return response.data;
}

export async function updateDailyRecord(goalId:number, dailyRecordId:number, dailyRecord:DailyRecordRequest): Promise<DailyRecord>{

    const response = await apiClient.put<DailyRecord>(`/api/goals/${goalId}/daily-records/${dailyRecordId}`,dailyRecord);

    return response.data;
}

export async function deleteDailyRecord(goalId: number, dailyRecordId:number):Promise<void>{
    await apiClient.delete(`/api/goals/${goalId}/daily-records/${dailyRecordId}`);
}