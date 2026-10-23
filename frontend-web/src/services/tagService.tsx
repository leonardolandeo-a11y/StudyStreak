import apiClient from "./apiClient";

import type {
    Tag,
    TagRequest
} from "../types/tag";

import type {
    PageResponse
} from "../types/page";


export async function getTags(userId:number, goalId:number, page = 0, size =10,signal?:AbortSignal):Promise<PageResponse<Tag>>{
    const response = await apiClient.get<PageResponse<Tag>>(`/users/${userId}/goals/${goalId}/tags`,{
        params:{
            page,
            size
        },
        signal
    });

    return response.data;
}

export async function getTag(userId:number, goalId:number,tagId:number):Promise<Tag>{
    const response = await apiClient.get<Tag>(`/users/${userId}/goals/${goalId}/tags/${tagId}`);
    return response.data;
}

export async function createTag(userId: number,goalId: number,tag: TagRequest): Promise<Tag> {
    const response = await apiClient.post<Tag>(`/users/${userId}/goals/${goalId}/tags`,tag);

    return response.data;
}


export async function updateTag(userId: number,goalId: number,tagId: number,tag: TagRequest): Promise<Tag> {

    const response = await apiClient.patch<Tag>(`/users/${userId}/goals/${goalId}/tags/${tagId}`, tag);

    return response.data;
}


export async function deleteTag(userId: number,goalId: number,tagId: number): Promise<void> {

    await apiClient.delete(`/users/${userId}/goals/${goalId}/tags/${tagId}`);
}