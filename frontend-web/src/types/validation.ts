export interface Validation{
    id:number;
    approved:boolean;
    comment:string |null;
}

export interface ValidationRequest{
    approved:boolean;
    comment?:string;
}