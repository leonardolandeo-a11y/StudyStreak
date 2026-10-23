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
import LoadingState from "../components/ui/LoadingState";

import ErrorMessage from "../components/ui/ErrorMessage";

import EmptyState from "../components/ui/EmptyState";

import PaginationControls from "../components/ui/PaginationControls";

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

        if (!userId) {
            return;
        }

        const controller =new AbortController();


        async function loadNotifications(id :number) {

            try {

                dispatch({
                    type: "LOAD_START"
                });

                let result:PageResponse<Notification>;


                if (selectedType) {

                    result =await getNotificationsByType(
                                id,
                                selectedType,
                                page,
                                20,
                                controller.signal
                            );

                } else if (filter === "unread") {

                    result =await getUnreadNotifications(
                                id,
                                page,
                                20,
                                controller.signal
                            );

                } else {

                    result =await getNotifications(
                                id,
                                page,
                                20,
                                controller.signal
                            );
                }


                dispatch({
                    type: "LOAD_SUCCESS",
                    payload: result
                });

            } catch {

                if (!controller.signal.aborted) {

                    dispatch({
                        type: "LOAD_ERROR",
                        payload:
                            "Could not load notifications."
                    });
                }
            }
        }


        void loadNotifications(userId);


        return () => {
            controller.abort();
        };

    }, [
        userId,
        page,
        filter,
        selectedType,
        refreshKey
    ]);
    

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
                <LoadingState
                    message="Loading notifications..."
                />
            )}


            {error && (
                <ErrorMessage
                    message={error}
                />
            )}

            {success && (
                <p className="mt-6 text-green-500">
                    {success}
                </p>
            )}

            {!loading &&
                !error &&
                notificationPage?.empty && (
                    <EmptyState
                        message="No notifications found."
                    />
            )}


        {!loading &&
            !error &&
            notificationPage &&
            !notificationPage.empty && (
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
                    <PaginationControls
                        page={page}
                        totalPages={
                            notificationPage.totalPages
                        }
                        first={
                            notificationPage.first
                        }
                        last={
                            notificationPage.last
                        }
                        onPrevious={() =>
                            handlePageChange(page - 1)
                        }
                        onNext={() =>
                            handlePageChange(page + 1)
                        }
                    />
                )}

        </div>
    )
}
export default Notifications;