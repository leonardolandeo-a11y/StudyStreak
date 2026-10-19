export interface Goal{
    id :number;
    topic:string;
    frequency:number;
    duration:number;
    completed:boolean;
}
export interface GoalRequest{
    topic:string;
    frequency:number;
    duration:number;
    completed:boolean;
}