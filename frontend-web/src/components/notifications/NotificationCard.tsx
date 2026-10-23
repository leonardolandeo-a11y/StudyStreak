import type{
    Notification
} from "../../types/notification";

interface NotificationCardProps{
    notification :Notification;
    onMarkAsRead:(notificationId: number) =>Promise<void>;
    onDelete: (notificationId:number) =>Promise<void>;
    loading : boolean;
}

function NotificationCard({notification,onMarkAsRead,onDelete,loading}:NotificationCardProps){
    return (
    <article
        className={`
            rounded-2xl
            border
            p-5
            shadow-lg shadow-black/10
            transition
            ${
                notification.read
                    ? "border-slate-800 bg-slate-900/60"
                    : "border-sky-900/60 bg-sky-950/20"
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
            <div className="min-w-0 flex-1">

                <div className="flex flex-wrap items-center gap-2">

                    <span
                        className={`
                            rounded-full
                            px-3 py-1
                            text-xs font-semibold
                            ${
                                notification.read
                                    ? "bg-slate-800 text-slate-400"
                                    : "bg-sky-950/70 text-sky-300"
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
                            border border-slate-700
                            bg-slate-950
                            px-3 py-1
                            text-xs font-medium
                            text-slate-400
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
                        text-slate-100
                    "
                >
                    {notification.message}
                </p>


                <p className="mt-3 text-xs text-slate-500">
                    {new Date(
                        notification.createdAt
                    ).toLocaleString()}
                </p>

            </div>
        </div>


        <div className="mt-5 flex flex-wrap gap-3">

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
                        bg-sky-500
                        px-4 py-2
                        text-sm font-semibold
                        text-slate-950
                        hover:bg-sky-400
                        disabled:opacity-50
                    "
                >
                    {loading
                        ? "Processing..."
                        : "Mark as Read"}
                </button>
            )}


            <button
                type="button"
                disabled={loading}
                onClick={() =>
                    void onDelete(
                        notification.id
                    )
                }
                className="
                    rounded-lg
                    border border-red-900
                    bg-red-950/30
                    px-4 py-2
                    text-sm font-medium
                    text-red-300
                    hover:bg-red-950/60
                    disabled:opacity-50
                "
            >
                {loading
                    ? "Processing..."
                    : "Delete"}
            </button>

        </div>
    </article>
    )
}
export default NotificationCard;