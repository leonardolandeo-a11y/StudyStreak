package com.example.studystreak.service;

/** Counts Unicode scalar values consistently with PostgreSQL varchar limits. */
final class ProfileText {
    private ProfileText() {}
    static String displayName(String value) {
        if (value == null) return null;
        int start = 0, end = value.length();
        while (start < end && space(value.codePointAt(start))) start += Character.charCount(value.codePointAt(start));
        while (end > start && space(value.codePointBefore(end))) end -= Character.charCount(value.codePointBefore(end));
        String normalized = value.substring(start, end);
        validate(normalized, 60, false);
        return normalized.isEmpty() ? null : normalized;
    }
    static String bio(String value) {
        if (value == null) return null;
        validate(value, 300, true);
        return value.isEmpty() ? null : value;
    }
    private static boolean space(int cp) { return Character.isWhitespace(cp) || Character.isSpaceChar(cp); }
    private static void validate(String text, int max, boolean multiline) {
        int count = 0;
        for (int i = 0; i < text.length();) {
            int cp = text.codePointAt(i);
            boolean line = cp == '\n' || cp == '\r' || cp == '\t';
            if (cp >= 0xD800 && cp <= 0xDFFF || Character.isISOControl(cp) && !(multiline && line)
                    || !multiline && (cp == 0x2028 || cp == 0x2029)) {
                throw new IllegalArgumentException("Profile contains invalid text characters");
            }
            if (++count > max) throw new IllegalArgumentException("Profile text exceeds " + max + " Unicode characters");
            i += Character.charCount(cp);
        }
    }
}
