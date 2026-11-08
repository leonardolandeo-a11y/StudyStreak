import { apiClient } from './apiClient';
import { getSessionRevision } from './authSession';
export type ProfileImageSlot = 'avatar' | 'banner';
export interface ProfileStatistics {
  studyStreak: number; bestStudyStreak: number; verifiedMinutes: number; verifiedSessions: number; activeGoals: number;
}
export interface OwnProfile {
  id: number; username: string; presentationName: string; displayName: string | null; bio: string | null;
  registrationDate?: string | null; statistics?: ProfileStatistics;
}
export async function getOwnProfile(signal: AbortSignal, revision = getSessionRevision()): Promise<OwnProfile> {
  return (await apiClient.get<OwnProfile>('/api/profile', { signal, ...{ _sessionRevision: revision } })).data;
}
export async function patchOwnProfile(displayName: string | null, bio: string | null, signal: AbortSignal, revision = getSessionRevision()): Promise<OwnProfile> {
  return (await apiClient.patch<OwnProfile>('/api/profile', { displayName, bio }, { signal, ...{ _sessionRevision: revision } })).data;
}
export async function putOwnProfileImage(slot: ProfileImageSlot, bytes: ArrayBuffer, type: string, signal: AbortSignal, revision = getSessionRevision()) {
  await apiClient.put(`/api/profile/${slot}`, bytes, { signal, ...{ _sessionRevision: revision }, headers: { 'Content-Type': type }, timeout: 30000 });
}
export async function deleteOwnProfileImage(slot: ProfileImageSlot, signal: AbortSignal, revision = getSessionRevision()) {
  await apiClient.delete(`/api/profile/${slot}`, { signal, ...{ _sessionRevision: revision } });
}
