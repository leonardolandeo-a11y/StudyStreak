import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ProfileContext } from "./ProfileContext";
import { useAuth } from "../hooks/useAuth";
import { useObjectUrl } from "../hooks/useObjectUrl";
import { getProfile, getProfileImage } from "../services/profileService";
import { getApiErrorMessage } from "../utils/apiError";
import type { UserProfile } from "../types/profile";

function ProfileSession({ children }: { children: ReactNode }) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [assets, setAssets] = useState<{ avatar: Blob | null; banner: Blob | null }>({ avatar: null, banner: null });
    const [imageErrors, setImageErrors] = useState<{ avatar: string | null; banner: string | null }>({ avatar: null, banner: null });
    const active = useRef<AbortController | null>(null);
    const load = useCallback(() => {
        active.current?.abort();
        const controller = new AbortController(); active.current = controller;
        return Promise.allSettled([
            getProfile(controller.signal), getProfileImage("avatar", controller.signal), getProfileImage("banner", controller.signal)
        ]).then(([data, avatar, banner]) => {
        if (controller.signal.aborted) return;
        if (data.status === "fulfilled") { setProfile(data.value); setError(null); }
        else setError(getApiErrorMessage(data.reason, "Could not load your profile."));
        setAssets(previous => ({ avatar: avatar.status === "fulfilled" ? avatar.value : previous.avatar, banner: banner.status === "fulfilled" ? banner.value : previous.banner }));
        setImageErrors({ avatar: avatar.status === "rejected" ? getApiErrorMessage(avatar.reason, "Could not load avatar.") : null,
            banner: banner.status === "rejected" ? getApiErrorMessage(banner.reason, "Could not load banner.") : null });
        setLoading(false);
        });
    }, []);
    const refresh = useCallback(async () => { setLoading(true); await load(); }, [load]);
    // Initial loading is already true; only asynchronous results update effect state.
    useEffect(() => { void load(); return () => active.current?.abort(); }, [load]);
    const avatarUrl = useObjectUrl(assets.avatar), bannerUrl = useObjectUrl(assets.banner);
    const value = useMemo(() => ({ profile, loading, error, avatarUrl, bannerUrl, imageErrors, refresh }), [profile, loading, error, avatarUrl, bannerUrl, imageErrors, refresh]);
    return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}
export function ProfileProvider({ children }: { children: ReactNode }) {
    const { currentUser } = useAuth();
    // A different account starts with empty state and releases the old account's URLs.
    return <ProfileSession key={currentUser?.id ?? "anonymous"}>{children}</ProfileSession>;
}
