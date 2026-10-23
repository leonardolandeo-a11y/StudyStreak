import {useMemo} from "react";

import { useSearchParams } from "react-router-dom";

import type{
    NotificationType
} from "../types/notification";

export const NOTIFICATION_TYPES:NotificationType[] = [
    "PENDING_CHECK_IN",
    "VALIDATION_RECEIVED",
    "WEEKLY_SUMMARY",
    "GOAL_COMPLETED",
    "TRACKING_REQUESTED",
    "TRACKING_ACCEPTED",
    "TRACKING_REJECTED",
    "TRACKING_BROKEN"
]

export function useNotificationFilters(){
    const [searchParams, setSearchParams] = useSearchParams();

    const {page,filter,selectedType} = useMemo(()=>{
        const pageParam=Number(searchParams.get("page")?? "0");

        const page = Number.isSafeInteger(pageParam) && pageParam>= 0? pageParam : 0;

        const filter = searchParams.get("filter")==="unread" ? "unread":"all";

        const typeParam = searchParams.get("type");

        const selectedType :NotificationType|null = NOTIFICATION_TYPES.includes(typeParam as NotificationType) ? typeParam as NotificationType : null;
        return {
            page, 
            filter,
            selectedType
        }
    },[searchParams]);

    function handleFilterChange(newFilter:"all"|"unread"){
        setSearchParams({
            filter:newFilter,
            page:"0"
        });

    }
    function handleTypeChange(type: NotificationType | "") {

        if (type === "") {

            setSearchParams({
                filter: "all",
                page: "0"
            });

            return;
        }

        setSearchParams({
            type,
            page: "0"
        });
    }


    function handlePageChange(newPage: number) {

        if (selectedType) {

            setSearchParams({
                type: selectedType,
                page: String(newPage)
            });

            return;
        }

        setSearchParams({
            filter,
            page: String(newPage)
        });
    }


    return {
        page,
        filter,
        selectedType,
        handleFilterChange,
        handleTypeChange,
        handlePageChange
    };
} 
export default useNotificationFilters;