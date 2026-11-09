import type { LoginResponse } from '../types/auth';

let revision = 0;
let knownAccess: string | null | undefined;
let knownRefresh: string | null | undefined;

// Observe the existing storage used by login/logout/restoration. A refresh is
// the only credential replacement that keeps outstanding requests in this scope.
export function getSessionRevision(): number {
    const access = sessionStorage.getItem('accessToken');
    const refresh = sessionStorage.getItem('refreshToken');
    if (access !== knownAccess || refresh !== knownRefresh) {
        revision++;
        knownAccess = access;
        knownRefresh = refresh;
    }
    return revision;
}

export function assertSessionRevision(expected: number): void {
    if (getSessionRevision() !== expected) throw new Error('Authentication session changed.');
}

export function storeRefreshedSession(tokens: LoginResponse, expected: number): void {
    assertSessionRevision(expected);
    sessionStorage.setItem('accessToken', tokens.token);
    sessionStorage.setItem('refreshToken', tokens.refreshToken);
    knownAccess = tokens.token;
    knownRefresh = tokens.refreshToken;
}
