import { useEffect, useState, useSyncExternalStore } from 'react';
import { createWidgetStore } from '../features/dashboard/widgetPreferences';
import { dashboardWidgetStorage } from '../services/dashboardWidgetStorage';
export function useDashboardWidgets(userId: number) {
    const [store] = useState(() => createWidgetStore(dashboardWidgetStorage(userId)));
    const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
    useEffect(() => { void store.hydrate(); }, [store]);
    return { ...state, save: store.save };
}
