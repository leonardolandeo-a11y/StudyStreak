import type { AuthenticatedUser } from '../types/auth';

type JwtPayload = {
  sub?: unknown;
  userId?: unknown;
  email?: unknown;
  role?: unknown;
  type?: unknown;
  exp?: unknown;
};

// Decode claims for UI state only. Token integrity is verified by Spring Security.
function decodeBase64Url(input: string): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/, '');
  let buffer = 0;
  let bits = 0;
  const encodedBytes: string[] = [];

  for (const character of normalized) {
    const value = alphabet.indexOf(character);
    if (value < 0) throw new Error('Malformed token');
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      encodedBytes.push('%' + ((buffer >> bits) & 255).toString(16).padStart(2, '0'));
    }
  }
  return decodeURIComponent(encodedBytes.join(''));
}

export function getUserFromToken(token: string): AuthenticatedUser | null {
  try {
    const pieces = token.split('.');
    if (pieces.length !== 3) return null;
    const payload = JSON.parse(decodeBase64Url(pieces[1])) as JwtPayload;
    if (payload.type !== 'access' || typeof payload.exp !== 'number') return null;
    if (payload.exp * 1000 <= Date.now() + 15_000) return null;
    if (typeof payload.userId !== 'number' || !Number.isSafeInteger(payload.userId)) return null;
    if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') return null;
    if (payload.role !== 'USER' && payload.role !== 'ADMIN') return null;
    return { id: payload.userId, username: payload.sub, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}
