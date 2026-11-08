import axios from "axios";
import apiClient from "./apiClient";
import type { ProfileImageSlot, ProfilePatch, UserProfile } from "../types/profile";

export async function getProfile(signal?: AbortSignal): Promise<UserProfile> {
    return (await apiClient.get<UserProfile>("/api/profile", { signal })).data;
}
export async function patchProfile(patch: ProfilePatch): Promise<UserProfile> {
    return (await apiClient.patch<UserProfile>("/api/profile", patch)).data;
}
export async function getProfileImage(slot: ProfileImageSlot, signal?: AbortSignal): Promise<Blob | null> {
    try {
        return (await apiClient.get<Blob>(`/api/profile/${slot}`, { responseType: "blob", signal })).data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) return null;
        throw error;
    }
}
export async function putProfileImage(slot: ProfileImageSlot, file: File): Promise<void> {
    await apiClient.put(`/api/profile/${slot}`, file, { headers: { "Content-Type": file.type }, timeout: 30000 });
}
export async function deleteProfileImage(slot: ProfileImageSlot): Promise<void> {
    await apiClient.delete(`/api/profile/${slot}`);
}
