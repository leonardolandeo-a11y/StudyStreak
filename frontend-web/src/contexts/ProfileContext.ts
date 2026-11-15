import { createContext } from "react";
import type { UserProfile } from "../types/profile";
export interface ProfileContextValue {
    profile: UserProfile | null;
    loading: boolean;
    error: string | null;
    avatarUrl?: string;
    bannerUrl?: string;
    imageErrors: { avatar: string | null; banner: string | null };
    refresh: () => Promise<void>;
}
// UserPanel can also render outside the protected layout (e.g. presentation tests).
export const ProfileContext = createContext<ProfileContextValue | null>(null);
