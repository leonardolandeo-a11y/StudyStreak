import { useCallback, useMemo } from "react";

import { useSearchParams } from "react-router-dom";

import type{
    NotificationType
} from "../types/notification";

export const NOTIFICATION_TYPES:NotificationType[] = [
    "PENDING_CHECK_IN",
    "VALIDATION_RECEIVED",
    "DAILY_RECORD_CREATED",
    "WEEKLY_SUMMARY",
    "GOAL_COMPLETED",
    "TRACKING_REQUESTED",
    "TRACKING_ACCEPTED",
    "TRACKING_REJECTED",
    "TRACKING_BROKEN"
]

export function useNotificationFilters(){
    const [searchParams, setSearchParams] = useSearchParams();

    const {page,filter,selectedType,size} = useMemo(()=>{
        const pageParam=Number(searchParams.get("page")?? "0");

        const page = Number.isSafeInteger(pageParam) && pageParam>= 0? pageParam : 0;
        const sizeParam = Number(searchParams.get("size") ?? "20");
        const size = [10, 20, 25, 50, 100].includes(sizeParam) ? sizeParam : 20;

        const filter = searchParams.get("filter")==="unread" ? "unread":"all";

        const typeParam = searchParams.get("type");

        const selectedType :NotificationType|null = NOTIFICATION_TYPES.includes(typeParam as NotificationType) ? typeParam as NotificationType : null;
        return {
            page, size,
            filter,
            selectedType
        }
    },[searchParams]);

    function handleFilterChange(newFilter:"all"|"unread") {
        setSearchParams(current => { const next = new URLSearchParams(current); next.set("filter", newFilter); next.delete("type"); next.delete("page"); return next; });
    }
    function handleTypeChange(type: NotificationType | "") {
        setSearchParams(current => { const next = new URLSearchParams(current); if (type) { next.set("type", type); next.delete("filter"); } else { next.delete("type"); next.set("filter", "all"); } next.delete("page"); return next; });
    }


    const handlePageChange = useCallback((newPage: number, replace = false) => {
        if (newPage < 0) return;
        setSearchParams(current => { const next = new URLSearchParams(current); if (newPage === 0) next.delete("page"); else next.set("page", String(newPage)); return next; }, { replace });
    }, [setSearchParams]);

    const handleSizeChange = useCallback((nextSize: number) => {
        setSearchParams(current => { const next = new URLSearchParams(current); next.set("size", String(nextSize)); next.delete("page"); return next; });
    }, [setSearchParams]);


    return {
        page, size,
        filter,
        selectedType,
        handleSizeChange,
        handleFilterChange,
        handleTypeChange,
        handlePageChange
    };
} 
export default useNotificationFilters;