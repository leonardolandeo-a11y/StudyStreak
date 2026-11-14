import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { getSocialProfile } from '../../services/socialService';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES, socialProfilePath } from '../../routes/paths';
/** Room membership alone is not authorization to read a social profile. */
export function RoomProfileLink({ id, name, children }: { id: number; name: string; children: ReactNode }) {
    const { currentUser } = useAuth();
    const account = `${currentUser?.id}:${id}`;
    const [authorization, setAuthorization] = useState<string | null>(null);
    useEffect(() => {
        if (id === currentUser?.id) return;
        const controller = new AbortController();
        void getSocialProfile(id, controller.signal).then(() => { if (!controller.signal.aborted) setAuthorization(account); }).catch(() => { if (!controller.signal.aborted) setAuthorization(null); });
        return () => controller.abort();
    }, [id, currentUser?.id, account]);
    if (id === currentUser?.id || authorization === account) return <Link className="room-participant-identity room-participant-profile" aria-label={`View profile of ${name}`} to={id === currentUser?.id ? ROUTES.profile : socialProfilePath(id)}>{children}</Link>;
    return <div className="room-participant-identity">{children}</div>;
}
