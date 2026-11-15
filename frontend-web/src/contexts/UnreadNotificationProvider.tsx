import type { Notification } from '../types/notification';
import { createNotificationCursor } from '../features/notifications/incomingNotifications';
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
import { getNotifications, getUnreadNotificationCount } from "../services/notificationService";

// Retain only a watermark across provider remounts; logout/account changes reset it.
let cursorSession: { userId: number; cursor: ReturnType<typeof createNotificationCursor> } | null = null;

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
    const [incoming, setIncoming] = useState<{userId:number; rows:Notification[]} | null>(null);
    const notices = useMemo(() => incoming && incoming.userId === userId ? incoming.rows : [], [incoming,userId]);
    const dismissNotice = useCallback((id: number) => setIncoming(previous => previous && previous.userId === userId ? { ...previous, rows: previous.rows.filter(row => row.id !== id) } : previous), [userId]);
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

        if(cursorSession?.userId !== userId)cursorSession={userId,cursor:createNotificationCursor()};
        const cursor=cursorSession.cursor;
        const task = Promise.all([
            getUnreadNotificationCount(userId, controller.signal).catch(() => null),
            getNotifications(userId, 0, 20, controller.signal).catch(() => null),
        ])
            .then(([count,page]) => {
                if (controller.signal.aborted || requestId !== requestIdRef.current) return;
                if(count !== null)setSnapshot({ userId, count });
                if(page){
                    const fresh=cursor.observe(page.content);
                    setIncoming(previous => ({userId,rows:[...(previous && previous.userId === userId ? previous.rows.filter(row => !page.content.some(item => item.id === row.id && item.read)) : []),...fresh].filter((row,index,all)=>all.findIndex(item=>item.id===row.id)===index).slice(-3)}));
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
            cursorSession=null;
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
        const intervalId = window.setInterval(refreshWhenVisible, 30000);

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
        notices,
        dismissNotice,
        refreshUnreadCount
    }), [unreadCount, notices, dismissNotice, refreshUnreadCount]);

    return (
        <UnreadNotificationContext.Provider value={contextValue}>
            {children}
        </UnreadNotificationContext.Provider>
    );
}

export default UnreadNotificationProvider;
