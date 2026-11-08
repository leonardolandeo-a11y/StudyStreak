import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";
import { SocialContext } from "./SocialContext";
import { getPrivacy, getPresence, getSocialProfile, heartbeat, putPrivacy, type Presence, type SocialPrivacy } from "../services/socialService";
import { getApiErrorMessage } from "../utils/apiError";

function SocialSession({ id, children }: { id: number; children: ReactNode }) {
    const [privacy, setPrivacy] = useState<SocialPrivacy | null>(null);
    const [presence, setPresence] = useState<Presence | null>(null);
    const [registrationDate, setRegistrationDate] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    // In-memory per mount: tabs and authenticated sessions never share a presence key.
    const [session] = useState(() => crypto.randomUUID());
    useEffect(() => {
        const controller = new AbortController();
        void Promise.all([getPrivacy(controller.signal), getSocialProfile(id, controller.signal)]).then(([p, profile]) => {
            if (controller.signal.aborted) return;
            setPrivacy(p); setRegistrationDate(profile.registrationDate ?? null); setPresence(profile.presence ?? null);
        }).catch(failure => { if (!controller.signal.aborted) setError(getApiErrorMessage(failure, 'Social settings are unavailable.')); });
        return () => controller.abort();
    }, [id]);
    useEffect(() => {
        if (!privacy?.showPresence && !privacy?.showLastSeen) return;
        const controller = new AbortController();
        let lastActivity = Date.now(), pending = false;
        const activity = () => { lastActivity = Date.now(); };
        const tick = async () => {
            if (document.hidden || pending) return;
            pending = true;
            try {
                const value = Date.now() - lastActivity < 90000 ? await heartbeat(session, controller.signal) : await getPresence(id, controller.signal);
                if (!controller.signal.aborted) setPresence(value);
            } catch { if (!controller.signal.aborted) setPresence(null); }
            finally { pending = false; }
        };
        const visibility = () => { if (!document.hidden) { activity(); void tick(); } };
        window.addEventListener('pointerdown', activity, { passive: true }); window.addEventListener('keydown', activity);
        document.addEventListener('visibilitychange', visibility); window.addEventListener('focus', visibility);
        void tick(); const timer = window.setInterval(() => void tick(), 30000);
        return () => { controller.abort(); clearInterval(timer); window.removeEventListener('pointerdown', activity); window.removeEventListener('keydown', activity); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('focus', visibility); };
    }, [id, privacy?.showPresence, privacy?.showLastSeen, session]);
    const savePrivacy = useCallback(async (value: SocialPrivacy) => {
        const saved = await putPrivacy(value);
        setPresence(null); setPrivacy(saved); setError(null);
    }, []);
    return <SocialContext.Provider value={{ privacy, presence, registrationDate, error, savePrivacy }}>{children}</SocialContext.Provider>;
}
export function SocialProvider({ children }: { children: ReactNode }) {
    const { currentUser } = useAuth();
    return currentUser ? <SocialSession key={currentUser.id} id={currentUser.id}>{children}</SocialSession> : children;
}
