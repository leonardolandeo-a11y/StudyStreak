export interface GoalSummary {
    active: number;
    completed: number;
}

export interface StreakSummary {
    current: number;
    best: number;
}

export interface RecordSummary {
    lastSevenDays: number;
}

export interface ValidationSummary {
    reviewed: number;
    awaitingReview: number;
}
