import type { AuthenticatedUser, JwtPayload } from "../types/auth";

function decodeBase64Url(value: string): string {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    return atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
}

export function getUserFromToken(token: string): AuthenticatedUser | null {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        const payload = JSON.parse(decodeBase64Url(parts[1])) as Partial<JwtPayload>;
        if (payload.type !== "access" || typeof payload.exp !== "number" ||
            !Number.isFinite(payload.exp) || payload.exp * 1000 <= Date.now() + 15000) return null;
        if (typeof payload.userId !== "number" || !Number.isSafeInteger(payload.userId) || payload.userId <= 0) return null;
        if (typeof payload.sub !== "string" || typeof payload.email !== "string") return null;
        if (payload.role !== "USER" && payload.role !== "ADMIN") return null;
        return { id: payload.userId, username: payload.sub, email: payload.email, role: payload.role };
    } catch {
        return null;
    }
}
