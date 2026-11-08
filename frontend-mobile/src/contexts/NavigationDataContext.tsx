import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import type { File } from 'expo-file-system';
import { getOwnAvatar, getOwnProfile, type OwnProfile } from '../services/ownProfileService';
import { notificationService } from '../services/notificationService';
import { getApiErrorMessage } from '../utils/apiError';

type Value = { profile: OwnProfile | null; avatar: string | null; loading: boolean; error: string | null;
  unread: number | null; retry(): void };
export const NavigationDataContext = createContext<Value | null>(null);
export function NavigationDataProvider({ userId, children }: { userId: number; children: ReactNode }) {
  const [profile, setProfile] = useState<OwnProfile | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [unread, setUnread] = useState<number | null>(null);
  const retry = useCallback(() => { setProfile(null); setAvatar(null); setLoading(true); setError(null); setRevision(value => value + 1); }, []);
  useEffect(() => {
    const controller = new AbortController();
    let image: File | null = null;
    const dispose = () => { try { if (image?.exists) image.delete(); } catch { /* Best-effort private cache cleanup. */ } };
    void getOwnProfile(controller.signal).then(async data => {
      if (controller.signal.aborted) return;
      setProfile(data); setLoading(false);
      try {
        image = await getOwnAvatar(userId, controller.signal);
        if (controller.signal.aborted) dispose(); else setAvatar(image.uri);
      } catch { /* Missing/forbidden/failed image keeps an accessible initial fallback. */ }
    }).catch(cause => {
      if (!controller.signal.aborted) { setError(getApiErrorMessage(cause, 'Could not load your profile.')); setLoading(false); }
    });
    return () => { controller.abort(); dispose(); };
  }, [userId, revision]);
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
  return <NavigationDataContext.Provider value={{ profile, avatar, loading, error, unread, retry }}>{children}</NavigationDataContext.Provider>;
}
export function useNavigationData() {
  const value = useContext(NavigationDataContext);
  if (!value) throw new Error('Navigation data provider is missing.');
  return value;
}
