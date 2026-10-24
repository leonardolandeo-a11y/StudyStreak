import {
    useContext
} from "react";

import {
    UnreadNotificationContext
} from "../contexts/UnreadNotificationContext";


export function useUnreadNotifications() {

    const context =useContext(UnreadNotificationContext);


    if (!context) {
        throw new Error(
            "useUnreadNotifications must be used inside UnreadNotificationProvider."
        );
    }


    return context;
}