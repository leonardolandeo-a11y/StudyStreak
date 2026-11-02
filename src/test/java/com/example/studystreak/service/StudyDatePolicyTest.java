package com.example.studystreak.service;

import com.example.studystreak.model.User;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class StudyDatePolicyTest {
    private final Clock clock = Clock.fixed(Instant.parse("2026-11-02T02:00:00Z"), ZoneOffset.UTC);

    @Test
    void usesUsersLocalDateInsteadOfServerDate() {
        User user = mock(User.class);
        when(user.getTimeZone()).thenReturn("America/Lima");
        assertEquals(LocalDate.of(2026, 11, 1), StudyDatePolicy.today(user, clock));

        when(user.getTimeZone()).thenReturn("Asia/Tokyo");
        assertEquals(LocalDate.of(2026, 11, 2), StudyDatePolicy.today(user, clock));
    }

    @Test
    void missingOrInvalidZoneUsesLima() {
        User user = mock(User.class);
        when(user.getTimeZone()).thenReturn("Bad/Zone");
        assertEquals(LocalDate.of(2026, 11, 1), StudyDatePolicy.today(user, clock));

        when(user.getTimeZone()).thenReturn(null);
        assertEquals(LocalDate.of(2026, 11, 1), StudyDatePolicy.today(user, clock));
    }
}
