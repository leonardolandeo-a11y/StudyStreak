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

export function goalDetailsPath(goalId:number):string{
    return `/goals/${goalId}`;
}

export function dailyRecordsPath(goalId:number):string{
    return `/goals/${goalId}/daily-records`;
}

export function dailyRecordDetailsPath(goalId:number, dailyRecordId:number):string{
    return `/goals/${goalId}/daily-records/${dailyRecordId}`;
}