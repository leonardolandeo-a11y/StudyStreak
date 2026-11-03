/**
 * UUID v4 used exclusively for server-side idempotent session records.
 * Goal ownership is still enforced by Spring Security; UUIDs aren't authorization tokens.
 */
export function createFocusSessionId(): string {
  const bytes = new Uint8Array(16);
  const nativeCrypto = globalThis.crypto;
  if (nativeCrypto?.getRandomValues) {
    nativeCrypto.getRandomValues(bytes);
  } else {
    // Hermes may lack WebCrypto. Mix wall-clock time with random values to
    // limit collision risk; no security or authorization relies on this ID.
    let seed = Date.now();
    for (let i = 0; i < bytes.length; i++) {
      seed = (seed + 0x6d2b79f5) >>> 0;
      bytes[i] = Math.floor(Math.random() * 256) ^ (seed & 255);
    }
  }
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
