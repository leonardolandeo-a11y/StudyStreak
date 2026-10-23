import type {
    Notification
}from "../types/notification";

import type{
    PageResponse
} from "../types/page";

export interface NotificationState{
    notificationPage: PageResponse<Notification>|null;
    
    loading : boolean;

    error : string|null;
    success :string |null;

    actionLoadingId:number|null;

    refreshKey:number;

}

export const initialNotificationState:NotificationState ={
    notificationPage :null,
    loading: true,
    error:null,
    success:null,
    actionLoadingId:null,
    refreshKey:0
};

export type NotificationAction = 
    |{
        type:"LOAD_START";
    }
    | {
        type: "LOAD_SUCCESS";
        payload: PageResponse<Notification>;
    }
    | {
        type: "LOAD_ERROR";
        payload: string;
    }
    | {
        type: "ACTION_START";
        payload: number;
    }
    | {
        type: "ACTION_SUCCESS";
        payload: string;
    }
    | {
        type: "ACTION_ERROR";
        payload: string;
    }
    | {
        type: "ACTION_END";
    }
    | {
        type: "REFRESH";
};

export function notificationReducer(state:NotificationState, action:NotificationAction):NotificationState{
    switch (action.type) {

        case "LOAD_START":
            return {
                ...state,
                loading: true,
                error: null
            };


        case "LOAD_SUCCESS":
            return {
                ...state,
                notificationPage: action.payload,
                loading: false,
                error: null
            };


        case "LOAD_ERROR":
            return {
                ...state,
                loading: false,
                error: action.payload
            };


        case "ACTION_START":
            return {
                ...state,
                actionLoadingId: action.payload,
                error: null,
                success: null
            };


        case "ACTION_SUCCESS":
            return {
                ...state,
                success: action.payload,
                error: null
            };


        case "ACTION_ERROR":
            return {
                ...state,
                error: action.payload,
                success: null
            };


        case "ACTION_END":
            return {
                ...state,
                actionLoadingId: null
            };


        case "REFRESH":
            return {
                ...state,
                refreshKey: state.refreshKey + 1
            };


        default:
            return state;
    }
}
