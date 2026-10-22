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
        <div className="border p-4 space-y-2">

            <p className="font-semibold">
                {notification.message}
            </p>

            <p>
                Type: {notification.type}
            </p>

            <p>
                Status: {notification.read? "Read": "Unread" }
            </p>

            <p>
                Created: {
                    new Date(
                        notification.createdAt
                    ).toLocaleString()
                }
            </p>

            <div className="flex gap-3">

                {!notification.read && (
                    <button
                        type="button"
                        disabled={loading}
                        onClick={() =>
                            void onMarkAsRead(
                                notification.id
                            )
                        }
                        className="border p-2 disabled:opacity-50"
                    >
                        Mark as Read
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
                    className="border p-2 disabled:opacity-50"
                >
                    Delete
                </button>

            </div>

        </div>
    )
}
export default NotificationCard;