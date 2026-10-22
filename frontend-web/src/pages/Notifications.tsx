import {
    useEffect,
    useState
} from "react";

import {
    useSearchParams
} from "react-router-dom";

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

const NOTIFICATION_TYPES:NotificationType[] =[
    "PENDING_CHECK_IN",
    "VALIDATION_RECEIVED",
    "WEEKLY_SUMMARY",
    "GOAL_COMPLETED",
    "TRACKING_REQUESTED",
    "TRACKING_ACCEPTED",
    "TRACKING_REJECTED",
    "TRACKING_BROKEN"
]


function Notifications(){
    const { currentUser} = useAuth();

    const [searchParams ,setSearchParams ]= useSearchParams();

    const pageParam= Number(searchParams.get("page") ?? "0");

    const page = Number.isSafeInteger(pageParam)&& pageParam>= 0 ? pageParam : 0;

    const filter = searchParams.get("filter") === "unread" ? "unread" : "all";

    const [error, setError] =useState<string | null>(null);
    
    const [notificationPage, setNotificationPage] = useState<PageResponse<Notification>|null>(null);

    const [loading, setLoading ] = useState(true);

    const userId = currentUser?.id;
    const [actionLoadingId, setActionLoadingId] = useState<number|null>(null);
    const [ success, setSuccess] = useState<string |null>(null);
    const [refreshKey,setRefreshKey] = useState(0);

    const typeParam = searchParams.get("type");

    const selectedType:NotificationType|null = NOTIFICATION_TYPES.includes(typeParam as NotificationType) ? 
        typeParam as NotificationType
        : null;
    

    function handleTypeChange(type: NotificationType|""){
        if (type === ""){
            setSearchParams({
                filter:"all",
                page:"0"
            });
            return;
        }
        setSearchParams({
            type,
            page:"0"
        });
    }
    function handleFilterChange(newFilter: "all" | "unread") {
        setSearchParams({
            filter: newFilter,
            page: "0"
        });
    }
    function handlePageChange(newPage:number){
        if (selectedType){
            setSearchParams({
            type:selectedType,
            page:String(newPage)
            });
            return;
        }
        setSearchParams({
            filter,
            page : String(newPage)
        });
    }

    async function handleMarkAsRead(notificationId:number):Promise<void>{
        if (!userId){
            return;
        }
        try{
            setActionLoadingId(notificationId);
            setError(null);
            setSuccess(null);

            await markNotificationAsRead(userId, notificationId);

            setSuccess("Notification marked as read.");

            setRefreshKey(previous =>previous+1);

        }catch{
            setError("Could not mark notification as read.");
        }finally{
            setActionLoadingId(null);
        }
    }

    async function handleDelete(notificationId:number):Promise<void>{
        if (!userId){
            return;
        }
        const confirmed = window.confirm("Are you sure you want to delete this notification?");
        if (!confirmed){
            return;
        }
        try{
            setActionLoadingId(notificationId);
            setError(null);
            setSuccess(null);

            await deleteNotification(userId, notificationId);

            setSuccess("Notification deleted successfully");
            setRefreshKey(previous=>previous+1);
        }catch{
            setError("Could not delete notification");
        }finally{
            setActionLoadingId(null);
        }
    }
    useEffect(() => {

        let cancelled = false;

        async function loadNotifications() {

            if (!userId) {
                return;
            }

            try {
                setLoading(true);
                setError(null);

                let result : PageResponse<Notification>;

                if (selectedType ){
                    result = await getNotificationsByType(userId,selectedType,page,20);
                }else if(filter === "unread"){
                    result = await getUnreadNotifications(userId, page, 20);
                }else{
                    result = await getNotifications(userId,page,20);
                }

                if (!cancelled) {
                    setNotificationPage(result);
                }

            } catch {

                if (!cancelled) {
                    setError(
                        "Could not load notifications."
                    );
                }

            } finally {

                if (!cancelled) {
                    setLoading(false);
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