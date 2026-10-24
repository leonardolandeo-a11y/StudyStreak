import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type ReactNode
} from "react";

import {
    UnreadNotificationContext
} from "./UnreadNotificationContext";

import {
    useAuth
} from "../hooks/useAuth";

import {
    getUnreadNotificationCount
} from "../services/notificationService";


interface UnreadNotificationProviderProps {
    children: ReactNode;
}


function UnreadNotificationProvider({
    children
}: UnreadNotificationProviderProps) {

    const {
        currentUser
    } = useAuth();


    const [
        unreadCount,
        setUnreadCount
    ] = useState(0);


    const refreshUnreadCount =
        useCallback(
            async () => {

                if (!currentUser) {
                    setUnreadCount(0);
                    return;
                }

                const count =
                    await getUnreadNotificationCount(
                        currentUser.id
                    );

                setUnreadCount(count);

            },
            [currentUser]
        );
    useEffect(() => {

        if (!currentUser) {
            return;
        }

        const controller =
            new AbortController();


        async function loadUnreadCount(
            userId: number
        ) {

            try {

                const count =
                    await getUnreadNotificationCount(
                        userId,
                        controller.signal
                    );

                setUnreadCount(count);

            } catch {

                if (!controller.signal.aborted) {
                    setUnreadCount(0);
                }
            }
        }


        void loadUnreadCount(
            currentUser.id
        );


        return () => {
            controller.abort();
        };

    }, [
        currentUser
    ]);

    const contextValue =
        useMemo(
            () => ({
                unreadCount,
                refreshUnreadCount
            }),
            [
                unreadCount,
                refreshUnreadCount
            ]
        );


    return (
        <UnreadNotificationContext.Provider
            value={contextValue}
        >
            {children}
        </UnreadNotificationContext.Provider>
    );
}


export default UnreadNotificationProvider;