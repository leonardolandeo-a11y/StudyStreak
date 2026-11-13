import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDashboardResource } from '../../hooks/useDashboardResource';
import { getActiveTrackingLinks } from '../../services/trackingLinkService';
import { socialProfilePath, ROUTES } from '../../routes/paths';
import { TrackingAvatar, TrackingAvatarProvider } from '../trackingLinks/TrackingAvatar';
import { AcademicSprite } from '../academic/AcademicSprite';
export function DashboardPartners({ userId }: { userId: number }) {
    const load = useCallback((signal: AbortSignal) => getActiveTrackingLinks(0, 3, signal), []);
    const { state, retry } = useDashboardResource(load);
    const links = state.status === 'success' ? state.data.content.filter(link => link.status === 'ACCEPTED' && (link.requesterId === userId || link.receiverId === userId)) : [];
    return <section className="study-panel p-4" aria-label="Study Partners"><h2 className="flex items-center gap-2 text-lg font-bold"><AcademicSprite name="scholar" width={28}/>Study Partners</h2>
        <p className="my-2 text-xs text-content-secondary">Accepted Tracking connections · first page</p>
        {state.status === 'loading' ? <p role="status">Loading study partners…</p> : state.status === 'error' ? <div role="alert"><p>Study partners could not be loaded.</p><button className="study-button" onClick={retry}>Retry partners</button></div> : !links.length ? <p className="text-sm text-content-secondary">No accepted partners on this page.</p> : <TrackingAvatarProvider revision={0}><ul>{links.map(link => {
            const own = link.requesterId === userId, id = own ? link.receiverId : link.requesterId, name = (own ? link.receiverUsername : link.requesterUsername) || 'Member';
            return <li key={link.id}><Link className="flex min-h-14 items-center gap-3 rounded-control py-2 hover:bg-surface-hover" to={socialProfilePath(id)}><TrackingAvatar id={id} name={name} className="size-9"/><span className="min-w-0 truncate font-semibold">{name}</span></Link></li>;
        })}</ul></TrackingAvatarProvider>}
        <Link to={ROUTES.trackingLinks} className="study-button mt-3">Manage Tracking</Link>
    </section>;
}
