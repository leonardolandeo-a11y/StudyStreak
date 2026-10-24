import {
    createContext
} from "react";


export interface UnreadNotificationContextValue {

    unreadCount: number;

    refreshUnreadCount:
        () => Promise<void>;
}


export const UnreadNotificationContext =createContext<UnreadNotificationContextValue | null>(null);