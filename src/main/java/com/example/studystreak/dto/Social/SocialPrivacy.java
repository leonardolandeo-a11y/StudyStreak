package com.example.studystreak.dto.Social;

import jakarta.validation.constraints.NotNull;

/** Complete replacement; boxed fields prevent missing values from silently disabling options. */
public record SocialPrivacy(@NotNull Boolean showPresence, @NotNull Boolean showLastSeen,
                            @NotNull Boolean shareVerifiedMinutes, @NotNull Boolean shareVerifiedSessions) {
    public static SocialPrivacy hidden() { return new SocialPrivacy(false, false, false, false); }
}
