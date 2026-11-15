export type GoalDifficulty = 'TRIVIAL' | 'EASY' | 'INTERMEDIATE' | 'HARD';
export const GOAL_DIFFICULTY_LABELS = { TRIVIAL: 'Intrascendente', EASY: 'Fácil', INTERMEDIATE: 'Intermedio', HARD: 'Difícil' } as const;

export interface Goal{
    id :number;
    topic:string;
    frequency:number;
    duration:number;
    completed:boolean;
    difficulty?: GoalDifficulty | null;
}
export interface GoalRequest{
    topic:string;
    frequency:number;
    duration:number;
    completed:boolean;
    difficulty?: GoalDifficulty | null;
}