import apiClient from "./apiClient"

import type {
    Notification,
    NotificationType
} from "../types/notification";

import type {
    PageResponse
} from "../types/page";

export async function getNotifications(userId :number , page =0 , size = 20,signal?: AbortSignal): Promise<PageResponse<Notification>>{

    const response = await apiClient.get<PageResponse<Notification>>(`/users/${userId}/notifications`,{
        params :{
            page,
            size
        },signal
    });
    return response.data;
}

export async function getUnreadNotifications(userId:number,page = 0, size = 20,signal?: AbortSignal): Promise<PageResponse<Notification>>{
    const response = await apiClient.get<PageResponse<Notification>>(`/users/${userId}/notifications/unread`,{
        params:{
            page,
            size
        },signal
    });
    return response.data;
}

export async function getNotificationsByType(userId:number, type: NotificationType, page= 0, size = 20,signal?: AbortSignal): Promise<PageResponse<Notification>>{
    const response = await apiClient.get<PageResponse<Notification>>(`/users/${userId}/notifications/type/${type}`,{
        params:{
            page,
            size
        },signal
    });
    return response.data;
}

export async function markNotificationAsRead(userId:number , notificationId:number){
    const response = await apiClient.patch<Notification>(`/users/${userId}/notifications/${notificationId}/read`);
    return response.data;
}

export async function deleteNotification(userId:number,notificationId:number):Promise<void>{
    await apiClient.delete(`/users/${userId}/notifications/${notificationId}`);
}