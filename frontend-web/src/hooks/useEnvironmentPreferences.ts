import { useEffect, useState, useSyncExternalStore } from 'react';
import { createEnvironmentStore, environmentKey } from '../features/environment/environmentPreferences';
/** Call inside an account-keyed subtree, as used by Dashboard and Settings. */
export function useEnvironmentPreferences(userId: number) {
    const [scope] = useState(() => {
        const key = environmentKey(userId);
        return { key, store: createEnvironmentStore({ read: () => localStorage.getItem(key), write: value => localStorage.setItem(key, value) }) };
    });
    const snapshot = useSyncExternalStore(scope.store.subscribe, scope.store.getSnapshot, scope.store.getSnapshot);
    useEffect(() => {
        scope.store.hydrate();
        const changed = (event: StorageEvent) => { if (event.key === scope.key || event.key === null) scope.store.hydrate(); };
        window.addEventListener('storage', changed);
        return () => window.removeEventListener('storage', changed);
    }, [scope]);
    return { ...snapshot, update: scope.store.update };
}
