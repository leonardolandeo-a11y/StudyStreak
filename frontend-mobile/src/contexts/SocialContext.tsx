import { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { PresenceSession } from '../features/social/presenceSession';
import { SocialDirectory, emptyDirectorySnapshot } from '../features/social/socialDirectory';
import { cleanStaleProfileMedia } from '../features/profile/ownProfileMedia';
export type SocialResources = { presence: PresenceSession; directory: SocialDirectory };
export const SocialContext = createContext<SocialResources | null>(null);
export function SocialProvider({ userId, children }: { userId: number; children: ReactNode }) {
  const [resources, setResources] = useState<SocialResources | null>(null);
  useEffect(() => {
    cleanStaleProfileMedia('social');
    let alive = true;
    const next = { presence: new PresenceSession(), directory: new SocialDirectory(userId) };
    const active = () => { const value = AppState.currentState === 'active'; next.presence.setActive(value); next.directory.setActive(value); };
    active(); void next.presence.load();
    const listener = AppState.addEventListener('change', active);
    void Promise.resolve().then(() => { if (alive) setResources(next); });
    return () => { alive = false; listener.remove(); next.presence.dispose(); next.directory.dispose(); };
  }, [userId]);
  return <SocialContext.Provider value={resources}>{children}</SocialContext.Provider>;
}
const subscribeNone = () => () => {};
const privacyEmpty = () => null;
export function useSocialPrivacy() {
  const resources = useContext(SocialContext);
  const state = useSyncExternalStore(resources?.presence.subscribe ?? subscribeNone, resources?.presence.getSnapshot ?? privacyEmpty, resources?.presence.getSnapshot ?? privacyEmpty);
  return { state, session: resources?.presence };
}
export function useSocialMember(id: number, kind: 'avatar' | 'profile' = 'avatar') {
  const resources = useContext(SocialContext);
  const directory = resources?.directory;
  const snapshot = useSyncExternalStore(directory?.subscribe ?? subscribeNone, directory?.getSnapshot ?? (() => emptyDirectorySnapshot), () => emptyDirectorySnapshot);
  useFocusEffect(useCallback(() => directory?.watch(id, kind), [directory, id, kind]));
  const accepted = snapshot.accepted.has(id);
  return { directory, avatar: accepted ? snapshot.avatars.get(id) ?? null : null, accepted, member: snapshot.members.get(id) };
}
