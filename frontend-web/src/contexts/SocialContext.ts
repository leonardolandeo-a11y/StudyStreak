import { createContext, useContext } from "react";
import type { Presence, SocialPrivacy } from "../services/socialService";
export const SocialContext = createContext<{
    privacy: SocialPrivacy | null; presence: Presence | null; registrationDate: string | null;
    error: string | null; savePrivacy: (value: SocialPrivacy) => Promise<void>;
} | null>(null);
export const useSocial = () => useContext(SocialContext);
