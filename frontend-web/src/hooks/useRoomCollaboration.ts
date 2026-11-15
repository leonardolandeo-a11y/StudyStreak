import { useEffect, useMemo, useSyncExternalStore } from 'react';
import apiClient from '../services/apiClient';
import { useAuth } from './useAuth';
import { createCollaboration, type ChatFeed, type ChatMessage } from '../features/studyRooms/collaborationState';
export function useRoomCollaboration(roomId: string) {
    const { currentUser } = useAuth();
    const accountId = currentUser?.id;
    const store = useMemo(() => {
        const endpoint = `/api/study-rooms/${roomId}/collaboration`;
        return createCollaboration({
            feed: async (page, signal) => (await apiClient.get<ChatFeed>(endpoint, { params: { page }, signal })).data,
            send: async (message, signal) => (await apiClient.post<ChatMessage>(endpoint + '/messages', message, { signal })).data,
            action: async (path, data, method, signal) => { await apiClient.request({ url: endpoint + path, data, method, signal }); },
        }, () => { if (!accountId) throw new Error('Session unavailable.'); return crypto.randomUUID(); });
    }, [roomId, accountId]);
    const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
    useEffect(() => {
        const update = () => document.hidden ? store.stop() : store.start();
        update(); document.addEventListener('visibilitychange', update); window.addEventListener('online', update);
        return () => { document.removeEventListener('visibilitychange', update); window.removeEventListener('online', update); store.stop(); };
    }, [store]);
    return { ...state, error: state.actionError ?? state.loadError ?? state.historyError, setText: store.setText,
        retry: store.retry, loadEarlier: store.loadEarlier, send: store.send, action: store.action };
}
