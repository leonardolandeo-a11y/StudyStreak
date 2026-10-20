export type TrackingStatus =
    "PENDING" |
    "ACCEPTED" |
    "REJECTED";

export interface TrackingLink {
    id: number;
    requesterId: number;
    receiverId: number;
    status: TrackingStatus;
}

export interface TrackingLinkStatusRequest {
    status: "ACCEPTED" | "REJECTED";
}