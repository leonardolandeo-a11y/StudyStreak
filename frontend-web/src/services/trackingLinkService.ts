import apiClient from "./apiClient";

import type {
    TrackingLink,
    TrackingLinkStatusRequest
} from "../types/trackingLink";

import type {
    PageResponse
} from "../types/page";


export async function getTrackingLinks(page = 0,size = 10): Promise<PageResponse<TrackingLink>> {

    const response =await apiClient.get<PageResponse<TrackingLink>>("/api/tracking-links",{
        params: { 
            page,
            size
        }
    });

    return response.data;
}


export async function getPendingTrackingLinks(page = 0,size = 10): Promise<PageResponse<TrackingLink>> {

    const response =await apiClient.get<PageResponse<TrackingLink>>("/api/tracking-links/pending",{
        params: {
            page,
            size
        }
    });

    return response.data;
}


export async function getActiveTrackingLinks(page = 0,size = 10): Promise<PageResponse<TrackingLink>> {

    const response = await apiClient.get<PageResponse<TrackingLink>>("/api/tracking-links/active",{
        params: {
            page,
            size
        }
    });

    return response.data;
}


export async function createTrackingLink(receiverId: number): Promise<TrackingLink> {

    const response = await apiClient.post<TrackingLink>(`/api/tracking-links/${receiverId}`);

    return response.data;
}

export async function getTrackingLinkWithUser(otherUserId: number): Promise<TrackingLink> {

    const response = await apiClient.get<TrackingLink>(`/api/tracking-links/with/${otherUserId}`);

    return response.data;
}


export async function updateTrackingLinkStatus(trackingId: number,request: TrackingLinkStatusRequest): Promise<TrackingLink> {

    const response = await apiClient.patch<TrackingLink>( `/api/tracking-links/${trackingId}/status`,request);

    return response.data;
}


export async function deleteTrackingLink(trackingId: number): Promise<void> {

    await apiClient.delete(`/api/tracking-links/${trackingId}`);
}