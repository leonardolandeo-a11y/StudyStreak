export interface DailyRecord{
    id:number;
    ownerUserId?: number | null;
    date :string;
    note : string | null;
    evidence: string | null;
    photoAvailable:boolean;
    voiceAvailable:boolean;
}

export interface DailyRecordRequest{
    date?:string;
    note?:string;
    evidence? : string;
}
