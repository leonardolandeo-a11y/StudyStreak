import { useEffect, useState, useSyncExternalStore } from 'react';
import { createWidgetStore, widgetKey } from '../features/dashboard/widgetPreferences';
export function useDashboardWidgets(userId: number) {
    const [store] = useState(() => {
        const key = widgetKey(userId);
        return createWidgetStore({ read: async () => localStorage.getItem(key), write: async value => { localStorage.setItem(key, value); } });
    });
    const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
    useEffect(() => { void store.hydrate(); }, [store]);
    return { ...state, save: store.save };
}
