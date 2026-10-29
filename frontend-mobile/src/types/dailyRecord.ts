export interface DailyRecord {
  id: number;
  date: string;
  note: string | null;
  evidence: string | null;
  photoAvailable: boolean;
  voiceAvailable: boolean;
}

export interface DailyRecordRequest {
  date: string;
  note?: string;
  evidence?: string;
}
