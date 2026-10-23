import {
    useCallback,
    useEffect,
    useReducer
} from "react";
import {
    notificationReducer,
    initialNotificationState
} from "../reducers/notificationReducer";

import {
    getNotifications,
    getUnreadNotifications,
    getNotificationsByType,
    markNotificationAsRead,
    deleteNotification
} from "../services/notificationService";

import {
    useAuth
} from "../hooks/useAuth";

import type { PageResponse } from "../types/page";

import NotificationCard from "../components/notifications/NotificationCard";

import type{
    Notification,
    NotificationType
}from "../types/notification";

import {
    useNotificationFilters,
    NOTIFICATION_TYPES
} from "../hooks/useNotificationFilters";

function Notifications(){
    const {currentUser} = useAuth();
    const {
        page,
        filter,
        selectedType,
        handleFilterChange,
        handleTypeChange,
        handlePageChange
    } = useNotificationFilters();

    const [state, dispatch] =useReducer(notificationReducer,initialNotificationState );

    const {
        notificationPage,
        loading,
        error,
        success,
        actionLoadingId,
        refreshKey
    } = state;

    
    const userId = currentUser?.id;
    
    



    const handleMarkAsRead = useCallback( async (notificationId:number):Promise<void>=>{
        if (!userId) {
            return;
        }

        try {

            dispatch({
                type: "ACTION_START",
                payload: notificationId
            });

            await markNotificationAsRead(
                userId,
                notificationId
            );

            dispatch({
                type: "ACTION_SUCCESS",
                payload:
                    "Notification marked as read."
            });

            dispatch({
                type: "REFRESH"
            });

        } catch {

            dispatch({
                type: "ACTION_ERROR",
                payload:
                    "Could not mark notification as read."
            });

        } finally {

            dispatch({
                type: "ACTION_END"
            });
        }

    },[userId]);

    const handleDelete = useCallback(async (notificationId:number):Promise<void> =>{
        if (!userId) {
            return;
        }

        const confirmed =window.confirm("Are you sure you want to delete this notification?");

        if (!confirmed) {
            return;
        }

        try {
            dispatch({
                type: "ACTION_START",
                payload: notificationId
            });

            await deleteNotification(
                userId,
                notificationId
            );

            dispatch({
                type: "ACTION_SUCCESS",
                payload:
                    "Notification deleted successfully."
            });

            dispatch({
                type: "REFRESH"
            });

        } catch {

            dispatch({
                type: "ACTION_ERROR",
                payload:
                    "Could not delete notification."
            });

        } finally {

            dispatch({
                type: "ACTION_END"
            });
        }

    },[userId]);
    

    useEffect(() => {

        let cancelled = false;

        async function loadNotifications() {

            if (!userId) {
                return;
            }

            try {
                dispatch({
                    type: "LOAD_START"
                });

                let result : PageResponse<Notification>;

                if (selectedType ){
                    result = await getNotificationsByType(userId,selectedType,page,20);
                }else if(filter === "unread"){
                    result = await getUnreadNotifications(userId, page, 20);
                }else{
                    result = await getNotifications(userId,page,20);
                }

                if (!cancelled) {
                    dispatch({
                        type: "LOAD_SUCCESS",
                        payload: result
                    });
                }

            } catch {

                if (!cancelled) {
                        dispatch({
                            type: "LOAD_ERROR",
                            payload:
                                "Could not load notifications."
                        });
                }

            } 
        }

        void loadNotifications();

        return () => {
            cancelled = true;
        };

    }, [userId, page, filter,selectedType,refreshKey]);
    if (!currentUser){
        return null;
    }
    return (
        <div className="p-6">

            <h1 className="text-3xl font-bold">
                Notifications
            </h1>


            <div className="mt-6 flex gap-3">

                <button
                    type="button"
                    onClick={() =>
                        handleFilterChange("all")
                    }
                    className="border p-2"
                >
                    All
                </button>

                <button
                    type="button"
                    onClick={() =>
                        handleFilterChange("unread")
                    }
                    className="border p-2"
                >
                    Unread
                </button>
                <select
                    value={selectedType ?? ""}
                    onChange={(event) =>
                        handleTypeChange(
                            event.target.value as
                                NotificationType | ""
                        )
                    }
                    className="border p-2"
                >
                    <option value="">
                        Filter by type
                    </option>

                    {NOTIFICATION_TYPES.map(
                        (type) => (
                            <option
                                key={type}
                                value={type}
                            >
                                {type}
                            </option>
                        )
                    )}

                </select>

            </div>


            {loading && (
                <p className="mt-6">
                    Loading notifications...
                </p>
            )}


            {error && (
                <p className="mt-6 text-red-500">
                    {error}
                </p>
            )}

            {success && (
                <p className="mt-6 text-green-500">
                    {success}
                </p>
            )}

            {!loading &&
                !error &&
                notificationPage?.empty && (
                    <p className="mt-6">
                        No notifications found.
                    </p>
                )}


            {!loading &&
                !error &&
                notificationPage && (
                    <div className="mt-6 space-y-4">

                        {notificationPage.content.map(
                            (notification) => (
                                <NotificationCard
                                    key={notification.id}
                                    notification={notification}
                                    onMarkAsRead={handleMarkAsRead}
                                    onDelete={handleDelete}
                                    loading={
                                        actionLoadingId ===
                                        notification.id
                                    }
                                />
                            )
                        )}

                    </div>
                )}


            {notificationPage &&
                !notificationPage.empty && (
                    <div className="mt-6 flex gap-3">

                        <button
                            type="button"
                            disabled={
                                notificationPage.first
                            }
                            onClick={() =>
                                handlePageChange(page - 1)
                            }
                            className="border p-2 disabled:opacity-50"
                        >
                            Previous
                        </button>

                        <p className="p-2">
                            Page{" "}
                            {notificationPage.number + 1}
                            {" of "}
                            {notificationPage.totalPages}
                        </p>

                        <button
                            type="button"
                            disabled={
                                notificationPage.last
                            }
                            onClick={() =>
                                handlePageChange(page + 1)
                            }
                            className="border p-2 disabled:opacity-50"
                        >
                            Next
                        </button>

                    </div>
                )}

        </div>
    )
}
export default Notifications;