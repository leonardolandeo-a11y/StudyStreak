import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { getOwnProfile, type OwnProfile, type ProfileImageSlot } from '../services/ownProfileService';
import { OwnProfileMedia, cleanStaleProfileMedia, type SelectedProfileAsset, type ProfileImageDraft } from '../features/profile/ownProfileMedia';
import { notificationService } from '../services/notificationService';
import { getApiErrorMessage } from '../utils/apiError';
import { getSessionRevision } from '../services/authSession';

type Value = { profile: OwnProfile | null; avatar: string | null; banner?: string | null; loading: boolean; error: string | null;
  imageErrors?: Partial<Record<ProfileImageSlot, string>>; unread: number | null; retry(): void;
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
    const controller = new AbortController(); let inFlight = false;
    const refresh = () => {
      if (inFlight || AppState.currentState !== 'active' || controller.signal.aborted) return;
      inFlight = true;
      void notificationService.countUnread(userId, controller.signal).then(count => {
        if (!controller.signal.aborted) setUnread(count);
      }).catch(() => {}).finally(() => { inFlight = false; });
    };
    refresh(); const timer = setInterval(refresh, 30000);
    const listener = AppState.addEventListener('change', refresh);
    return () => { controller.abort(); clearInterval(timer); listener.remove(); };
  }, [userId]);
  return <NavigationDataContext.Provider value={{ profile, avatar, banner, loading, error, imageErrors, unread, retry, refresh, ensureBanner,
    prepareImage: (slot, asset) => { if (!scope.current) return Promise.reject(new Error('Profile is unavailable.')); return scope.current.media.prepare(slot, asset); },
    imageBytes: draft => { if (!scope.current) return Promise.reject(new Error('Profile is unavailable.')); return scope.current.media.bytes(draft); },
    releaseImage: uri => scope.current?.media.release(uri),
  }}>{children}</NavigationDataContext.Provider>;
}
export function useNavigationData() {
  const value = useContext(NavigationDataContext);
  if (!value) throw new Error('Navigation data provider is missing.');
  return value;
}
