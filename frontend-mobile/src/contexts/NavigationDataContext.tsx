import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, View } from 'react-native';
import { getOwnProfile, type OwnProfile, type ProfileImageSlot } from '../services/ownProfileService';
import { OwnProfileMedia, cleanStaleProfileMedia, type SelectedProfileAsset, type ProfileImageDraft } from '../features/profile/ownProfileMedia';
import { createUnreadCounter } from '../features/notifications/unreadCounter';
import { NotificationPopups } from '../components/notifications/NotificationPopups';
import { createNotificationCursor, appendNotificationPopups } from '../features/notifications/incomingNotifications';
import type { Notification } from '../types/notification';
import { notificationService } from '../services/notificationService';
import { getApiErrorMessage } from '../utils/apiError';
import { getSessionRevision } from '../services/authSession';

type Value = { profile: OwnProfile | null; avatar: string | null; banner?: string | null; loading: boolean; error: string | null;
  imageErrors?: Partial<Record<ProfileImageSlot, string>>; unread: number | null; refreshUnread(): Promise<void>; retry(): void;
  refresh(): Promise<void>; ensureBanner(): Promise<void>;
  prepareImage(slot: ProfileImageSlot, asset: SelectedProfileAsset): Promise<ProfileImageDraft>;
  imageBytes(draft: ProfileImageDraft): Promise<ArrayBuffer>; releaseImage(uri: string): void };
type Scope = { revision: number; controller: AbortController; media: OwnProfileMedia; bannerWanted: boolean; imageRevision: Record<ProfileImageSlot, number>; request?: Promise<void>; refresh?: Promise<void> };
export const NavigationDataContext = createContext<Value | null>(null);
export function NavigationDataProvider({ userId, children }: { userId: number; children: ReactNode }) {
  const [profile, setProfile] = useState<OwnProfile | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Partial<Record<ProfileImageSlot, string>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unread, setUnread] = useState<number | null>(null);
  const [incoming, setIncoming] = useState<{owner:number;rows:Notification[]}>({owner:userId,rows:[]});
  const dismissPopup = useCallback((id:number) => setIncoming(previous=>previous.owner===userId?{owner:userId,rows:previous.rows.filter(row=>row.id!==id)}:previous),[userId]);
  const unreadCounter = useRef<ReturnType<typeof createUnreadCounter> | null>(null);
  const refreshUnread = useCallback(() => unreadCounter.current?.refresh(true) ?? Promise.resolve(), []);
  const scope = useRef<Scope | null>(null);
  const bannerRequested = useRef(false);
  const loadImage = useCallback(async (owner: Scope, slot: ProfileImageSlot) => {
    const revision = owner.imageRevision[slot];
    const active = () => scope.current === owner && !owner.controller.signal.aborted && owner.imageRevision[slot] === revision;
    try {
      const uri = await owner.media.load(slot);
      if (!active()) return;
      (slot === 'avatar' ? setAvatar : setBanner)(uri);
      setImageErrors(previous => ({ ...previous, [slot]: undefined }));
    } catch(cause) {
      if (!active()) return;
      (slot === 'avatar' ? setAvatar : setBanner)(null);
      setImageErrors(previous => ({ ...previous, [slot]: getApiErrorMessage(cause, `Could not load your ${slot}.`) }));
    }
  }, []);
  const reload = useCallback(async (refreshImages: boolean) => {
    const owner = scope.current; if (!owner) return;
    if (owner.request) { await owner.request; if (!refreshImages) return; }
    if (scope.current !== owner || owner.controller.signal.aborted) return;
    setLoading(true); setError(null);
    owner.request = (async () => {
      try {
        const data = await getOwnProfile(owner.controller.signal, owner.revision);
        if (scope.current !== owner || owner.controller.signal.aborted) return;
        setProfile(data);
        if (refreshImages) {
          for (const slot of ['avatar', 'banner'] as const) { owner.imageRevision[slot]++; owner.media.invalidate(slot); }
        }
        await Promise.all([loadImage(owner, 'avatar'), ...(owner.bannerWanted ? [loadImage(owner, 'banner')] : [])]);
      } catch(cause) {
        if (scope.current === owner && !owner.controller.signal.aborted) setError(getApiErrorMessage(cause, 'Could not load your profile.'));
      } finally { if (scope.current === owner && !owner.controller.signal.aborted) setLoading(false); }
    })();
    await owner.request; owner.request = undefined;
  }, [loadImage]);
  const refresh = useCallback(() => {
    const owner = scope.current; if (!owner) return Promise.resolve();
    if (owner.refresh) return owner.refresh;
    const task = reload(true).finally(() => { if (owner.refresh === task) owner.refresh = undefined; });
    owner.refresh = task; return task;
  }, [reload]);
  const retry = useCallback(() => { void refresh(); }, [refresh]);
  const ensureBanner = useCallback(async () => {
    bannerRequested.current = true;
    const owner = scope.current; if (!owner) return;
    owner.bannerWanted = true; await loadImage(owner, 'banner');
  }, [loadImage]);
  useEffect(() => {
    cleanStaleProfileMedia();
    const owner: Scope = { revision: getSessionRevision(), controller: new AbortController(), media: new OwnProfileMedia(userId), bannerWanted: bannerRequested.current, imageRevision: { avatar: 0, banner: 0 } };
    scope.current = owner; void reload(false);
    return () => { owner.controller.abort(); owner.media.dispose(); if (scope.current === owner) scope.current = null; };
  }, [userId, reload]);
  useEffect(() => {
    let disposed=false;
    const cursor=createNotificationCursor();
    const counter = createUnreadCounter(async signal => {
      const page=await notificationService.unread(userId,0,signal);
      if(!disposed&&!signal.aborted) {
        const fresh=cursor.observe(Array.isArray(page.content)?page.content:[]);
        if(fresh.length)setIncoming(previous=>({owner:userId,rows:appendNotificationPopups(previous.owner===userId?previous.rows:[],fresh)}));
      }
      return page.totalElements;
    }, setUnread);
    unreadCounter.current = counter;
    const refresh = () => { if (AppState.currentState === 'active') void counter.refresh(); };
    refresh(); const timer = setInterval(refresh, 30000);
    const listener = AppState.addEventListener('change', state => { if(state==='active')refresh();else counter.cancel(); });
    return () => { disposed=true; counter.dispose(); clearInterval(timer); listener.remove(); if (unreadCounter.current === counter) unreadCounter.current = null; };
  }, [userId]);
  return <NavigationDataContext.Provider value={{ profile, avatar, banner, loading, error, imageErrors, unread, refreshUnread, retry, refresh, ensureBanner,
    prepareImage: (slot, asset) => { if (!scope.current) return Promise.reject(new Error('Profile is unavailable.')); return scope.current.media.prepare(slot, asset); },
    imageBytes: draft => { if (!scope.current) return Promise.reject(new Error('Profile is unavailable.')); return scope.current.media.bytes(draft); },
    releaseImage: uri => scope.current?.media.release(uri),
  }}><View style={{flex:1}}>{children}<NotificationPopups key={userId} userId={userId} notifications={incoming.owner===userId?incoming.rows:[]} dismiss={dismissPopup} refresh={refreshUnread}/></View></NavigationDataContext.Provider>;
}
export function useNavigationData() {
  const value = useContext(NavigationDataContext);
  if (!value) throw new Error('Navigation data provider is missing.');
  return value;
}
