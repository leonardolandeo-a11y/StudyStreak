import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { getActiveTrackingLinks } from "../services/trackingLinkService";
import { getPresence, getSocialImage, getSocialProfile, type Presence } from "../services/socialService";
import { createRequestQueue } from "../utils/requestQueue";

export interface StudyPartner { id: number; name: string; username: string; presence: Presence | null; profileReady: boolean }
const denied = (failure: unknown) => axios.isAxiosError(failure) && [403, 404].includes(failure.response?.status ?? 0);
export function useStudyPartners({ open, page, generation, userId, onInvalidPage }: {
    open: boolean; page: number; generation: number; userId: number; onInvalidPage: () => void;
}) {
    const [state, setState] = useState<{ generation: number; page: number; items: StudyPartner[]; pages: number; total: number; error: string | null; partial: boolean }>({ generation: -1, page: -1, items: [], pages: 1, total: 0, error: null, partial: false });
    const [avatarQueue] = useState(() => createRequestQueue(2));
    const avatars = useRef(new Map<number, { blob: Blob | null; loadedAt: number }>());
    const inFlight = useRef(new Map<number, Promise<Blob | null>>());
    const authorized = useRef(new Set<number>());
    const session = useRef<AbortController | null>(null);
    const loadAvatar = useCallback(async (id: number, signal: AbortSignal) => {
        const current = session.current;
        if (!current || current.signal.aborted || !authorized.current.has(id)) throw new DOMException("Request aborted", "AbortError");
        const cached = avatars.current.get(id);
        if (cached && Date.now() - cached.loadedAt < 300000) return cached.blob;
        avatars.current.delete(id);
        if (signal.aborted) throw new DOMException("Request aborted", "AbortError");
        const existing = inFlight.current.get(id);
        if (existing) return existing;
        const request = avatarQueue(() => getSocialImage(id, "avatar", current.signal), current.signal).then(blob => {
            if (!current.signal.aborted && authorized.current.has(id)) {
                avatars.current.set(id, { blob, loadedAt: Date.now() });
                if (avatars.current.size > 40) avatars.current.delete(avatars.current.keys().next().value!);
            }
            return blob;
        }).finally(() => { if (inFlight.current.get(id) === request) inFlight.current.delete(id); });
        inFlight.current.set(id, request);
        return request;
    }, [avatarQueue]);
    useEffect(() => {
        if (!open) return;
        const controller = new AbortController(); session.current = controller;
        const requests = inFlight.current;
        const queue = createRequestQueue(2);
        let pending = false, tick = 0, members: StudyPartner[] = [];
        async function load() {
            if (pending || document.hidden) return;
            pending = true;
            try {
                const response = await getActiveTrackingLinks(page, 10, controller.signal);
                if (controller.signal.aborted) return;
                if (page > 0 && page >= response.totalPages) { onInvalidPage(); return; }
                const partners = new Map<number, string>();
                for (const link of response.content) {
                    if (link.status !== "ACCEPTED" || (link.requesterId !== userId && link.receiverId !== userId)) continue;
                    const id = link.requesterId === userId ? link.receiverId : link.requesterId;
                    if (Number.isSafeInteger(id) && id > 0 && id !== userId)
                        partners.set(id, (link.requesterId === userId ? link.receiverUsername : link.requesterUsername) || "Member");
                }
                authorized.current = new Set(partners.keys());
                for (const id of avatars.current.keys()) if (!partners.has(id)) avatars.current.delete(id);
                const retained = members.filter(member => partners.has(member.id));
                if (retained.length !== members.length) {
                    members = retained;
                    setState({ generation, page, items: retained, pages: Math.max(1, response.totalPages), total: response.totalElements, error: null, partial: false });
                }
                const previous = new Map(members.map(member => [member.id, member]));
                let partial = false;
                const results = await Promise.all(Array.from(partners, ([id, username]) => queue(async (): Promise<StudyPartner | null> => {
                    const old = previous.get(id);
                    try {
                        if (!old?.profileReady) {
                            const profile = await getSocialProfile(id, controller.signal);
                            return { id, username: profile.username, name: profile.presentationName || profile.username, presence: profile.presence, profileReady: true };
                        }
                        // Fully hidden presence has no useful minute-by-minute detail.
                        if (old.presence?.status === "HIDDEN" && !old.presence.lastSeenAt && tick % 3 !== 0) return old;
                        return { ...old, presence: await getPresence(id, controller.signal) };
                    } catch (failure) {
                        if (controller.signal.aborted) return null;
                        if (denied(failure)) { avatars.current.delete(id); authorized.current.delete(id); return null; }
                        partial = true;
                        return { id, username, name: old?.name || username, presence: null, profileReady: old?.profileReady ?? false };
                    }
                }, controller.signal)));
                if (controller.signal.aborted) return;
                members = results.filter((item): item is StudyPartner => item !== null).sort((a, b) => a.name.localeCompare(b.name));
                setState({ generation, page, items: members, pages: Math.max(1, response.totalPages), total: response.totalElements, error: null, partial });
                tick++;
            } catch {
                if (controller.signal.aborted) return;
                members = []; authorized.current.clear(); avatars.current.clear();
                setState({ generation, page, items: [], pages: 1, total: 0, error: "Could not load study partners. Please try again.", partial: false });
            } finally { pending = false; }
        }
        const visible = () => { if (!document.hidden) void load(); };
        void load();
        const timer = window.setInterval(() => void load(), 60000);
        document.addEventListener("visibilitychange", visible);
        return () => { controller.abort(); requests.clear(); clearInterval(timer); document.removeEventListener("visibilitychange", visible); };
    }, [open, page, generation, userId, onInvalidPage]);
    const clearAvatars = useCallback(() => avatars.current.clear(), []);
    const ready = state.generation === generation && state.page === page;
    return { ...state, items: ready ? state.items : [], error: ready ? state.error : null, loading: !ready, partial: ready && state.partial, loadAvatar, clearAvatars };
}
