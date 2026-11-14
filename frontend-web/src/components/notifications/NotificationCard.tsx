import { Trash2 } from 'lucide-react';
import type{
    Notification
} from "../../types/notification";

interface NotificationCardProps{
    notification :Notification;
    onMarkAsRead:(notificationId: number) =>Promise<void>;
    onDelete: (notificationId:number) =>Promise<void>;
    onOpen: (notification: Notification) => Promise<void>;
    loading : boolean;
}

import { notificationActionLabel } from '../../utils/notificationDestination';

function NotificationCard({notification,onMarkAsRead,onDelete,onOpen,loading}:NotificationCardProps){
    return (
    <article
        className={`
            rounded-2xl
            border
            p-5
            shadow-lg shadow-appearance-shadow/10
            transition
            ${
                notification.read
                    ? "border-outline bg-surface"
                    : "border-accent/50 bg-surface-raised"
            }
        `}
    >
        <div
            className="
                flex flex-wrap
                items-start
                justify-between
                gap-4
            "
        >
            <div
                role="button"
                tabIndex={loading ? -1 : 0}
                aria-disabled={loading}
                onClick={() => { if (!loading) void onOpen(notification); }}
                onKeyDown={(event) => {
                    if (!loading && (event.key === 'Enter' || event.key === ' ')) {
                        event.preventDefault();
                        void onOpen(notification);
                    }
                }}
                aria-label={`${notificationActionLabel(notification)}: ${notification.message}`}
                className="min-w-0 flex-1 cursor-pointer rounded-lg text-left focus-visible:outline-2 focus-visible:outline-accent"
            >

                <div className="flex flex-wrap items-center gap-2">

                    <span
                        className={`
                            rounded-full
                            px-3 py-1
                            text-xs font-semibold
                            ${
                                notification.read
                                    ? "bg-surface-hover text-content-muted"
                                    : "bg-accent-soft text-accent"
                            }
                        `}
                    >
                        {notification.read
                            ? "Read"
                            : "Unread"}
                    </span>

                    <span
                        className="
                            rounded-full
                            border border-outline-strong
                            bg-surface-hover
                            px-3 py-1
                            text-xs font-medium
                            text-content-muted
                        "
                    >
                        {notification.type}
                    </span>

                </div>


                <p
                    className="
                        mt-4
                        text-base font-medium
                        leading-6
                        text-content
                    "
                >
                    {notification.message}
                </p>


                <p className="mt-3 text-xs text-content-muted">
                    {new Date(
                        notification.createdAt
                    ).toLocaleString()}
                </p>

            </div>
        </div>


        <div className="mt-5 flex flex-wrap gap-3">
            <button
                type="button"
                disabled={loading}
                onClick={() => void onOpen(notification)}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-on-accent hover:bg-accent-hover disabled:opacity-50"
            >
                {notificationActionLabel(notification)}
            </button>

            {!notification.read && (
                <button
                    type="button"
                    disabled={loading}
                    onClick={() =>
                        void onMarkAsRead(
                            notification.id
                        )
                    }
                    className="
                        rounded-lg
                        bg-accent
                        px-4 py-2
                        text-sm font-semibold
                        text-on-accent
                        hover:bg-accent-hover
                        disabled:opacity-50
                    "
                >
                    {loading
                        ? "Processing..."
                        : "Mark as Read"}
                </button>
            )}


            <button type="button" disabled={loading} onClick={() => void onDelete(notification.id)}
                className="study-button size-11 p-0 text-danger hover:bg-danger-surface disabled:opacity-50"
                aria-label="Delete notification" title="Delete notification"><Trash2 size={18} aria-hidden="true"/></button>

        </div>
    </article>
    )
}
export default NotificationCard;