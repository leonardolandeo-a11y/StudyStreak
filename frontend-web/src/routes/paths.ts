export const ROUTES={
    home:"/",
    login: "/login",
    register:"/register",
    dashboard:"/dashboard",

    goals:"/goals",

    trackingLinks:"/tracking-links",
    validations: "/validations",
    notifications:"/notifications"
} as const;

export const ROUTE_PATTERNS = {
    goalDetails: "/goals/:goalId",
    dailyRecords:"/goals/:goalId/daily-records",
    dailyRecordDetails:"/goals/:goalId/daily-records/:dailyRecordId",
    tags:"/goals/:goalId/tags"
} as const;

export function goalDetailsPath(goalId:number):string{
    return `/goals/${goalId}`;
}

export function dailyRecordsPath(goalId:number):string{
    return `/goals/${goalId}/daily-records`;
}

export function dailyRecordDetailsPath(goalId:number, dailyRecordId:number):string{
    return `/goals/${goalId}/daily-records/${dailyRecordId}`;
}

export function tagsPath(goalId: number): string {
    return `/goals/${goalId}/tags`;
}