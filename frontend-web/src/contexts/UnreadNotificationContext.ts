import type { Notification } from '../types/notification';
import {
    createContext
} from "react";


export interface UnreadNotificationContextValue {

    unreadCount: number;
    notices?: Notification[];
    dismissNotice?: (id: number) => void;

    refreshUnreadCount:
        () => Promise<void>;
}


export const UnreadNotificationContext =createContext<UnreadNotificationContextValue | null>(null);