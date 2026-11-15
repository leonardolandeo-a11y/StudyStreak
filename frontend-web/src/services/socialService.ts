import apiClient from "./apiClient";
import axios from "axios";
export interface Presence { status: "ONLINE" | "OFFLINE" | "HIDDEN"; lastSeenAt: string | null; serverNow: string }
export interface SocialPrivacy { showPresence: boolean; showLastSeen: boolean; shareVerifiedMinutes: boolean; shareVerifiedSessions: boolean }
export interface SocialProfile {
    id: number; username: string; presentationName: string; bio: string | null; registrationDate: string | null;
    statistics: { verifiedMinutes?: number; verifiedSessions?: number }; presence: Presence;
}
export const hiddenPrivacy: SocialPrivacy = { showPresence: false, showLastSeen: false, shareVerifiedMinutes: false, shareVerifiedSessions: false };
export async function getSocialProfile(id: number, signal?: AbortSignal): Promise<SocialProfile> { return (await apiClient.get(`/api/users/${id}/profile`, { signal })).data; }
export async function getPresence(id: number, signal?: AbortSignal): Promise<Presence> { return (await apiClient.get(`/api/users/${id}/presence`, { signal })).data; }
export async function getPrivacy(signal?: AbortSignal): Promise<SocialPrivacy> { return (await apiClient.get('/api/profile/privacy', { signal })).data; }
export async function putPrivacy(value: SocialPrivacy): Promise<SocialPrivacy> { return (await apiClient.put('/api/profile/privacy', value)).data; }
export async function heartbeat(sessionId: string, signal?: AbortSignal): Promise<Presence> { return (await apiClient.post('/api/presence/heartbeat', { sessionId }, { signal })).data; }
export async function getSocialImage(id: number, slot: 'avatar' | 'banner', signal?: AbortSignal): Promise<Blob | null> {
    try { return (await apiClient.get(`/api/users/${id}/profile/${slot}`, { signal, responseType: 'blob' })).data; }
    catch (error) { if (axios.isAxiosError(error) && error.response?.status === 404) return null; throw error; }
}
