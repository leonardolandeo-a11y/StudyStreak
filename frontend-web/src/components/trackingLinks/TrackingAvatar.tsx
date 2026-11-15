import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getSocialImage } from "../../services/socialService";
import { useObjectUrl } from "../../hooks/useObjectUrl";
import { createRequestQueue } from "../../utils/requestQueue";
import { ProfileAvatar } from "../profile/ProfileAvatar";

const Avatars = createContext<((id: number) => Promise<Blob | null>) | null>(null);
/** Page-scoped protected images: no shared cache between authenticated accounts. */
export function TrackingAvatarProvider({ children, revision }: { children: ReactNode; revision: number }) {
    const [scope] = useState(() => ({ controller: new AbortController(), pending: new Map<string, Promise<Blob | null>>(), queue: createRequestQueue(2) }));
    useEffect(() => () => scope.controller.abort(), [scope]);
    const load = useCallback((id: number) => {
        const key = `${revision}:${id}`;
        const pending = scope.pending.get(key);
        if (pending) return pending;
        const request = scope.queue(() => getSocialImage(id, "avatar", scope.controller.signal), scope.controller.signal)
            .finally(() => scope.pending.delete(key));
        scope.pending.set(key, request);
        return request;
    }, [scope, revision]);
    return <Avatars.Provider value={load}>{children}</Avatars.Provider>;
}

export function TrackingAvatar({ id, name, className = "size-10" }: { id: number; name: string; className?: string }) {
    const load = useContext(Avatars);
    const [image, setImage] = useState<{ id: number; source: typeof load; blob: Blob | null } | null>(null);
    useEffect(() => {
        let active = true;
        void load?.(id).then(blob => { if (active) setImage({ id, source: load, blob }); }).catch(() => { if (active) setImage({ id, source: load, blob: null }); });
        return () => { active = false; };
    }, [id, load]);
    const src = useObjectUrl(image?.id === id && image.source === load ? image.blob : null);
    return <ProfileAvatar name={name} src={src} className={className} />;
}
