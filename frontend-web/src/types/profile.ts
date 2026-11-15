export interface UserProfile {
    id: number;
    username: string;
    displayName: string | null;
    presentationName: string;
    bio: string | null;
    statistics: {
        studyStreak: number;
        bestStudyStreak: number;
        verifiedMinutes: number;
        verifiedSessions: number;
        activeGoals: number;
    };
}
export type ProfileImageSlot = "avatar" | "banner";
export interface ProfilePatch { displayName?: string | null; bio?: string | null }
