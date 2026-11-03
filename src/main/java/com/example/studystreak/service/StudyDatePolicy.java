package com.example.studystreak.service;

import com.example.studystreak.model.User;

import java.time.Clock;
import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.ZoneId;

final class StudyDatePolicy {
    private static final ZoneId DEFAULT_ZONE = ZoneId.of("America/Lima");

    private StudyDatePolicy() {}

    static LocalDate today(User user) {
        return today(user, Clock.systemUTC());
    }

    static LocalDate today(User user, Clock clock) {
        return LocalDate.now(clock.withZone(zone(user)));
    }

    static ZoneId zone(User user) {
        ZoneId zone = DEFAULT_ZONE;
        try {
            if (user != null && user.getTimeZone() != null && !user.getTimeZone().isBlank()) {
                zone = ZoneId.of(user.getTimeZone());
            }
        } catch (DateTimeException ignored) {
            // Use the same fallback as daily record creation.
        }
        return zone;
    }
}
