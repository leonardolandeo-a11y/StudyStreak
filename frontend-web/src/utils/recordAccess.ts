// A query parameter is never a source of authority for editing or reviewing.
export type RecordAccess = "owner" | "reviewer" | "unknown";

export function recordAccess(
    ownerUserId: number | null | undefined,
    currentUserId: number | null | undefined
): RecordAccess {
    if (!Number.isSafeInteger(ownerUserId) || !Number.isSafeInteger(currentUserId) ||
        (ownerUserId ?? 0) <= 0 || (currentUserId ?? 0) <= 0) {
        return "unknown";
    }
    return ownerUserId === currentUserId ? "owner" : "reviewer";
}
