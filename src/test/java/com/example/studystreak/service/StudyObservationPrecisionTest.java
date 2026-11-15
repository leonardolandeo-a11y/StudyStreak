package com.example.studystreak.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** No Spring context, database, clock manipulation, migrations or persistent fixtures. */
class StudyObservationPrecisionTest {
    private static final Instant START = Instant.parse("2026-11-06T00:00:00.000100Z");

    private Map<String, Object> row(Instant start) {
        Map<String, Object> value = new HashMap<>();
        value.put("id", UUID.randomUUID());
        value.put("state", "RUNNING");
        value.put("planned_seconds", 300);
        value.put("observed_ms", 0L);
        value.put("observed_remainder_us", 0L);
        value.put("started_at", Timestamp.from(start));
        value.put("last_seen_at", Timestamp.from(start));
        value.put("ends_at", Timestamp.from(start.plusSeconds(300)));
        return value;
    }

    private StudyLedgerService service(Map<String, Object> row) {
        JdbcTemplate db = mock(JdbcTemplate.class);
        doAnswer(call -> {
            row.put("observed_ms", call.getArgument(1));
            row.put("observed_remainder_us", call.getArgument(2));
            row.put("last_seen_at", call.getArgument(3));
            return 1;
        }).when(db).update(startsWith("update study_ledger set observed_ms"), any(), any(), any(), any());
        return new StudyLedgerService(db, mock(CurrentUserService.class));
    }

    @Test void thirtyConsecutiveObservationsMustConserveExactlyFiveMinutes() {
        var row = row(START);
        var ledger = service(row);
        Instant previous = START;
        long truncated = 0;
        for (int i = 1; i <= 30; i++) {
            Instant next = i == 30 ? START.plusSeconds(300)
                    : START.plusSeconds(10L * i).plusNanos(500_000L * i);
            truncated += Duration.between(previous, next).toMillis();
            ReflectionTestUtils.invokeMethod(ledger, "observe", row, next);
            previous = next;
        }
        assertEquals(300_000L, Duration.between(START, previous).toMillis());
        assertEquals(299_985L, truncated, "The per-pulse truncation alone reproduces exactly 15 ms lost");
        assertEquals(300_000L, ((Number) row.get("observed_ms")).longValue());
        assertEquals(0L, ((Number) row.get("observed_remainder_us")).longValue());
    }

    @Test void subtractingEpochMillisecondsCanCreditAFiveMinuteBoundaryThatWasNotObserved() {
        Instant start = Instant.parse("2026-11-06T00:00:00.000900Z");
        Instant until = start.plusSeconds(300).minusNanos(200_000);
        // A GROUP participant joins a longer round with only 299999.8 ms remaining.
        // Its completion deadline is shared by the room, not start + planned duration.
        var row = row(start);
        row.put("source", "GROUP");
        row.put("planned_seconds", 1500);
        row.put("ends_at", Timestamp.from(until));
        var ledger = service(row);
        for (int i = 1; i <= 30; i++) {
            Instant next = i == 30 ? until : start.plusSeconds(10L * i);
            ReflectionTestUtils.invokeMethod(ledger, "observe", row, next);
        }
        assertEquals(299_999L, ((Number) row.get("observed_ms")).longValue());
        assertEquals(800L, ((Number) row.get("observed_remainder_us")).longValue());
        assertEquals(299_999L, Duration.between(start, until).toMillis());
        assertEquals(300_000L, until.toEpochMilli() - start.toEpochMilli());
        assertEquals(240L, Duration.between(start, until).toMillis() / 60_000 * 60);
        assertEquals(300L, (until.toEpochMilli() - start.toEpochMilli()) / 60_000 * 60,
                "The previously proposed epoch subtraction would overcredit this genuinely shorter interval");
    }

    @Test void persistedRemaindersDistinguishGroupHistoriesAcrossPauseAndResume() {
        Instant start = Instant.parse("2026-11-06T00:00:00Z");
        Instant pauseA = start.plusNanos(59_999_900_000L);
        Instant pauseB = start.plusNanos(59_999_100_000L);
        Instant resume = start.plusSeconds(70);
        Instant deadline = resume.plusNanos(500_000);
        var a = row(start);
        a.put("source", "GROUP");
        a.put("planned_seconds", 1500);
        var b = new HashMap<>(a);
        a.put("ends_at", Timestamp.from(deadline));
        b.put("ends_at", Timestamp.from(deadline));
        var ledgerA = service(a);
        var ledgerB = service(b);
        // Keep every observed gap within 35 s; the paused interval earns no time.
        ReflectionTestUtils.invokeMethod(ledgerA, "observe", a, start.plusSeconds(30));
        ReflectionTestUtils.invokeMethod(ledgerB, "observe", b, start.plusSeconds(30));
        ReflectionTestUtils.invokeMethod(ledgerA, "observe", a, pauseA);
        ReflectionTestUtils.invokeMethod(ledgerB, "observe", b, pauseB);
        a.put("state", "PAUSED"); b.put("state", "PAUSED");
        ReflectionTestUtils.invokeMethod(ledgerA, "observe", a, resume);
        ReflectionTestUtils.invokeMethod(ledgerB, "observe", b, resume);
        a.put("state", "RUNNING"); b.put("state", "RUNNING");
        assertEquals(59_999L, ((Number) a.get("observed_ms")).longValue());
        assertEquals(900L, ((Number) a.get("observed_remainder_us")).longValue());
        assertEquals(100L, ((Number) b.get("observed_remainder_us")).longValue());
        var withoutRemainderA = new HashMap<>(a);
        var withoutRemainderB = new HashMap<>(b);
        withoutRemainderA.remove("observed_remainder_us");
        withoutRemainderB.remove("observed_remainder_us");
        assertEquals(withoutRemainderA, withoutRemainderB);
        ReflectionTestUtils.invokeMethod(ledgerA, "observe", a, deadline);
        ReflectionTestUtils.invokeMethod(ledgerB, "observe", b, deadline);
        assertEquals(60_000L, ((Number) a.get("observed_ms")).longValue());
        assertEquals(59_999L, ((Number) b.get("observed_ms")).longValue());
        assertEquals(400L, ((Number) a.get("observed_remainder_us")).longValue());
        assertEquals(600L, ((Number) b.get("observed_remainder_us")).longValue());
        long realA = Duration.between(start, pauseA).plus(Duration.between(resume, deadline)).toNanos();
        long realB = Duration.between(start, pauseB).plus(Duration.between(resume, deadline)).toNanos();
        assertEquals(60_000_400_000L, realA);
        assertEquals(59_999_600_000L, realB);
        assertEquals(60L, realA / 60_000_000_000L * 60);
        assertEquals(0L, realB / 60_000_000_000L * 60);
    }

    @Test void thousandsOfSubmillisecondPulsesConserveTime() {
        var row = row(START);
        var ledger = service(row);
        for (int i = 1; i <= 8000; i++)
            ReflectionTestUtils.invokeMethod(ledger, "observe", row, START.plusNanos(i * 125_000L));
        assertEquals(1000L, ((Number) row.get("observed_ms")).longValue());
        assertEquals(0L, ((Number) row.get("observed_remainder_us")).longValue());
    }

    @ParameterizedTest @ValueSource(longs = {35_001, -1})
    void disconnectedOrBackwardTimeAddsNothingAndRetainsTheRemainder(long gapMs) {
        var row = row(START);
        row.put("observed_ms", 12L); row.put("observed_remainder_us", 900L);
        ReflectionTestUtils.invokeMethod(service(row), "observe", row, START.plusMillis(gapMs));
        assertEquals(12L, ((Number) row.get("observed_ms")).longValue());
        assertEquals(900L, ((Number) row.get("observed_remainder_us")).longValue());
    }

    @Test void pausesDoNotEarnTimeAndTheDeadlineCapsCredit() {
        var row = row(START);
        row.put("state", "PAUSED"); row.put("observed_remainder_us", 700L);
        var ledger = service(row);
        ReflectionTestUtils.invokeMethod(ledger, "observe", row, START.plusSeconds(10));
        assertEquals(0L, ((Number) row.get("observed_ms")).longValue());
        assertEquals(700L, ((Number) row.get("observed_remainder_us")).longValue());
        row.put("state", "RUNNING"); row.put("observed_ms", 299_000L);
        row.put("last_seen_at", Timestamp.from(START.plusSeconds(299)));
        ReflectionTestUtils.invokeMethod(ledger, "observe", row, START.plusSeconds(320));
        assertEquals(300_000L, ((Number) row.get("observed_ms")).longValue());
        assertEquals(0L, ((Number) row.get("observed_remainder_us")).longValue());
    }

    @Test void gapAtTheExistingLimitIsAcceptedAndRepeatingAnInstantDoesNotDuplicateTime() {
        var row = row(START);
        row.put("observed_remainder_us", 900L);
        var ledger = service(row);
        Instant limit = START.plusSeconds(35);
        ReflectionTestUtils.invokeMethod(ledger, "observe", row, limit);
        assertEquals(35_000L, ((Number) row.get("observed_ms")).longValue());
        assertEquals(900L, ((Number) row.get("observed_remainder_us")).longValue());
        var first = new HashMap<>(row);
        ReflectionTestUtils.invokeMethod(ledger, "observe", row, limit);
        assertEquals(first, row);
    }
}
