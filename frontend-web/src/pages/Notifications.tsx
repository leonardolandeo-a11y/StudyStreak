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
import { useToast } from "../hooks/useToast";
import { useConfirm } from "../hooks/useConfirm";
import {
    useUnreadNotifications
} from "../hooks/useUnreadNotifications";
function Notifications(){
    const {currentUser} = useAuth();
    const { showToast } = useToast();
    const {refreshUnreadCount} = useUnreadNotifications();
    const confirm = useConfirm();
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
        actionLoadingId,
        refreshKey
    } = state;
    
    const userId = currentUser?.id;
    
    

    const handleMarkAsRead = useCallback(
        async (
            notificationId: number
        ): Promise<void> => {

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
                await refreshUnreadCount();
                showToast(
                    "Notification marked as read.",
                    "success"
                );

                dispatch({
                    type: "REFRESH"
                });

            } catch {

                showToast(
                    "Could not mark notification as read.",
                    "error"
                );

            } finally {

                dispatch({
                    type: "ACTION_END"
                });
            }

        },
        [
            userId,
            showToast,
            refreshUnreadCount
        ]
    );
    const handleDelete = useCallback(
        async (
            notificationId: number
        ): Promise<void> => {

            if (!userId) {
                return;
            }

            const confirmed =
                await confirm({
                    title: "Delete notification?",
                    message:
                        "Are you sure you want to delete this notification? This action cannot be undone.",
                    confirmLabel: "Delete",
                    cancelLabel: "Cancel",
                    variant: "danger"
                });

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
                await refreshUnreadCount();

                showToast(
                    "Notification deleted successfully.",
                    "success"
                );

                dispatch({
                    type: "REFRESH"
                });

            } catch {

                showToast(
                    "Could not delete notification.",
                    "error"
                );

            } finally {

                dispatch({
                    type: "ACTION_END"
                });
            }

        },[userId,showToast,confirm,refreshUnreadCount]);
    
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
    <div className="space-y-8">

        <section>
            <p className="text-sm font-medium text-sky-400">
                Activity
            </p>

            <h1
                className="
                    mt-2
                    text-3xl font-bold
                    tracking-tight
                    text-slate-100
                "
            >
                Notifications
            </h1>

            <p className="mt-2 max-w-2xl text-slate-400">
                Review updates about your goals, validations,
                tracking activity, and progress.
            </p>
        </section>


        <section
            className="
                rounded-2xl
                border border-slate-800
                bg-slate-900/70
                p-5
            "
        >
            <div className="flex flex-wrap items-end gap-4">

                <div>
                    <p className="mb-2 text-sm font-medium text-slate-300">
                        Status
                    </p>

                    <div className="flex gap-2">

                        <button
                            type="button"
                            onClick={() =>
                                handleFilterChange("all")
                            }
                            className={`
                                rounded-lg
                                px-4 py-2
                                text-sm font-medium
                                ${
                                    filter === "all" &&
                                    !selectedType
                                        ? "bg-sky-500 text-slate-950"
                                        : "border border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800"
                                }
                            `}
                        >
                            All
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                handleFilterChange("unread")
                            }
                            className={`
                                rounded-lg
                                px-4 py-2
                                text-sm font-medium
                                ${
                                    filter === "unread" &&
                                    !selectedType
                                        ? "bg-sky-500 text-slate-950"
                                        : "border border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800"
                                }
                            `}
                        >
                            Unread
                        </button>

                    </div>
                </div>


                <div className="min-w-60 flex-1 sm:max-w-sm">
                    <label
                        htmlFor="notificationType"
                        className="mb-2 block text-sm font-medium text-slate-300"
                    >
                        Notification Type
                    </label>

                    <select
                        id="notificationType"
                        value={selectedType ?? ""}
                        onChange={(event) =>
                            handleTypeChange(
                                event.target.value as
                                    NotificationType | ""
                            )
                        }
                        className="
                            w-full
                            rounded-lg
                            border border-slate-700
                            bg-slate-950
                            px-3 py-2.5
                            text-slate-100
                            hover:border-slate-600
                        "
                    >
                        <option value="">
                            All types
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

            </div>
        </section>


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
                <section>

                    <div
                        className="
                            mb-5
                            flex flex-wrap
                            items-end
                            justify-between
                            gap-3
                        "
                    >
                        <div>
                            <h2 className="text-xl font-semibold text-slate-100">
                                Your notifications
                            </h2>

                            <p className="mt-1 text-sm text-slate-400">
                                Recent activity for your StudyStreak account.
                            </p>
                        </div>

                        <span
                            className="
                                rounded-full
                                border border-slate-800
                                bg-slate-900
                                px-3 py-1
                                text-xs font-medium
                                text-slate-400
                            "
                        >
                            {notificationPage.totalElements} total
                        </span>
                    </div>


                    <div className="grid gap-4 lg:grid-cols-2">

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

                </section>
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