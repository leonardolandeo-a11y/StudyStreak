import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode
} from "react";

import { UnreadNotificationContext } from "./UnreadNotificationContext";
import { useAuth } from "../hooks/useAuth";
import { getUnreadNotificationCount } from "../services/notificationService";

interface UnreadNotificationProviderProps {
    children: ReactNode;
}

interface UnreadSnapshot {
    userId: number;
    count: number;
}

function UnreadNotificationProvider({ children }: UnreadNotificationProviderProps) {
    const { currentUser } = useAuth();
    const userId = currentUser?.id;
    const [snapshot, setSnapshot] = useState<UnreadSnapshot | null>(null);
    const controllerRef = useRef<AbortController | null>(null);
    const pendingRef = useRef<Promise<void> | null>(null);
    const requestIdRef = useRef(0);

    const unreadCount = snapshot !== null && snapshot.userId === userId ? snapshot.count : 0;

    const loadUnreadCount = useCallback((force: boolean): Promise<void> => {
        if (userId === undefined) {
            return Promise.resolve();
        }

        if (!force && pendingRef.current) {
            return pendingRef.current;
        }

        controllerRef.current?.abort();
        const controller = new AbortController();
        controllerRef.current = controller;
        const requestId = ++requestIdRef.current;

        const task = getUnreadNotificationCount(userId, controller.signal)
            .then((count) => {
                if (!controller.signal.aborted && requestId === requestIdRef.current) {
                    setSnapshot({ userId, count });
                }
            })
            .catch(() => undefined)
            .finally(() => {
                if (controllerRef.current === controller) {
                    controllerRef.current = null;
                }
                if (pendingRef.current === task) {
                    pendingRef.current = null;
                }
            });

        pendingRef.current = task;
        return task;
    }, [userId]);

    const refreshUnreadCount = useCallback(
        () => loadUnreadCount(true),
        [loadUnreadCount]
    );

    useEffect(() => {
        if (userId === undefined) {
            return;
        }

        const refreshWhenVisible = () => {
            if (document.visibilityState === "visible") {
                void loadUnreadCount(false);
            }
        };

        refreshWhenVisible();
        window.addEventListener("focus", refreshWhenVisible);
        document.addEventListener("visibilitychange", refreshWhenVisible);
        const intervalId = window.setInterval(refreshWhenVisible, 45000);

        return () => {
            window.removeEventListener("focus", refreshWhenVisible);
            document.removeEventListener("visibilitychange", refreshWhenVisible);
            window.clearInterval(intervalId);
            requestIdRef.current += 1;
            controllerRef.current?.abort();
            controllerRef.current = null;
            pendingRef.current = null;
        };
    }, [userId, loadUnreadCount]);

    const contextValue = useMemo(() => ({
        unreadCount,
        refreshUnreadCount
    }), [unreadCount, refreshUnreadCount]);

    return (
        <UnreadNotificationContext.Provider value={contextValue}>
            {children}
        </UnreadNotificationContext.Provider>
    );
}

export default UnreadNotificationProvider;
