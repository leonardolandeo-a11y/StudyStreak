// Keep scalar limits and normalization aligned with the existing Profile contract.
import type { ProfileImageSlot } from "../../services/ownProfileService";
export const PROFILE_LIMITS = { displayName: 60, bio: 300, avatar: 2 * 1024 * 1024, banner: 5 * 1024 * 1024 } as const;
export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const unicodeLength = (value: string): number => Array.from(value).length;
// Match Character.isWhitespace || Character.isSpaceChar in the Java normalizer.
export function normalizeProfileName(value: string): string {
    const chars = Array.from(value);
    const space = (char: string) => {
        const cp = char.codePointAt(0)!;
        return cp >= 9 && cp <= 13 || cp >= 28 && cp <= 32 || cp >= 0x2000 && cp <= 0x200a ||
            [0xa0, 0x1680, 0x2028, 0x2029, 0x202f, 0x205f, 0x3000].includes(cp);
    };
    let start = 0, end = chars.length;
    while (start < end && space(chars[start])) start++;
    while (end > start && space(chars[end - 1])) end--;
    return chars.slice(start, end).join("");
}
export function profileTextError(displayName: string, bio: string): string | null {
    if (unicodeLength(normalizeProfileName(displayName)) > PROFILE_LIMITS.displayName) return "Display name must contain at most 60 characters.";
    if (unicodeLength(bio) > PROFILE_LIMITS.bio) return "Bio must contain at most 300 characters.";
    // Match the server's control-character and Unicode scalar validation.
    for (const char of normalizeProfileName(displayName)) {
        const code = char.codePointAt(0)!;
        if (code <= 31 || code >= 127 && code <= 159 || code >= 0xd800 && code <= 0xdfff || code === 0x2028 || code === 0x2029)
            return "Display name contains invalid text characters.";
    }
    for (const char of bio) {
        const code = char.codePointAt(0)!;
        if (code === 0 || code < 32 && ![9, 10, 13].includes(code) || code >= 127 && code <= 159 || code >= 0xd800 && code <= 0xdfff)
            return "Bio contains invalid text characters.";
    }
    return null;
}
export function profileImageError(slot: ProfileImageSlot, file: { type: string; size: number }): string | null {
    if (!IMAGE_TYPES.includes(file.type)) return "Choose a PNG, JPEG or WebP image.";
    if (!file.size) return "Choose a non-empty image.";
    if (file.size > PROFILE_LIMITS[slot]) return `${slot === "avatar" ? "Avatar" : "Banner"} must be ${slot === "avatar" ? 2 : 5} MiB or smaller.`;
    return null;
}
