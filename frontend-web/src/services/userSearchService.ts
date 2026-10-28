import apiClient from "./apiClient";
import type { PageResponse } from "../types/page";
import type { UserSearchResult } from "../types/userSearch";

export async function searchUsers(query: string, signal?: AbortSignal): Promise<UserSearchResult[]> {
    const response = await apiClient.get<PageResponse<UserSearchResult>>("/users/search", {
        params: { query },
        signal
    });
    return response.data.content;
}
