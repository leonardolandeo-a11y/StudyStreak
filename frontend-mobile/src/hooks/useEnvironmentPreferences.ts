import { useCallback, useState, useSyncExternalStore } from 'react';
import { useFocusEffect } from 'expo-router';
import { createEnvironmentStore } from '../features/environment/environmentPreferences';
import { environmentStorage } from '../services/environmentStorage';
/** Used inside account-keyed Dashboard/Settings subtrees; re-read on native Back. */
export function useEnvironmentPreferences(userId: number) {
    const [store] = useState(() => createEnvironmentStore(environmentStorage(userId)));
    const snapshot = useSyncExternalStore(store.subscribe,store.getSnapshot,store.getSnapshot);
    useFocusEffect(useCallback(() => {
        void store.hydrate();
        return () => store.cancelHydration();
    },[store]));
    return { ...snapshot, update: store.update };
}
