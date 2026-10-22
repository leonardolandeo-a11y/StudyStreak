
export type NotificationType =
    | "PENDING_CHECK_IN"
    | "VALIDATION_RECEIVED"
    | "WEEKLY_SUMMARY"
    | "GOAL_COMPLETED"
    | "TRACKING_REQUESTED"
    | "TRACKING_ACCEPTED"
    | "TRACKING_REJECTED"
    | "TRACKING_BROKEN";


export interface Notification{
    id: number;
    message: string;
    read :boolean;
    createdAt:string;
    type:NotificationType;
}