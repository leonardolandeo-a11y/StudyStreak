import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSocialProfile } from '../../services/socialService';
import { useAuth } from '../../hooks/useAuth';
import { MemberProfileLink } from '../social/MemberProfileLink';
import { ROUTES } from '../../routes/paths';
/** Room membership alone is not authorization to read a social profile. */
export function RoomProfileLink({ id, name }: { id: number; name: string }) {
    const { currentUser } = useAuth();
    const account = `${currentUser?.id}:${id}`;
    const [authorization, setAuthorization] = useState<string | null>(null);
    useEffect(() => {
        if (id === currentUser?.id) return;
        const controller = new AbortController();
        void getSocialProfile(id, controller.signal).then(() => { if (!controller.signal.aborted) setAuthorization(account); }).catch(() => { if (!controller.signal.aborted) setAuthorization(null); });
        return () => controller.abort();
    }, [id, currentUser?.id, account]);
    if (id === currentUser?.id) return <Link className="study-button mt-2" aria-label={`View profile of ${name}`} to={ROUTES.profile}>View profile</Link>;
    return authorization === account ? <MemberProfileLink id={id} name={name}/> : null;
}
