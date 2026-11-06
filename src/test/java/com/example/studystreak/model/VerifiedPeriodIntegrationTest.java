package com.example.studystreak.model;

import com.example.studystreak.controller.FocusStatisticsController;
import com.example.studystreak.repository.UserRepository;
import com.example.studystreak.service.StudyAnalyticsService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.sql.Timestamp;
import java.time.*;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
@EnabledIfEnvironmentVariable(named = "STUDYSTREAK_POSTGRES_INTEGRATION", matches = "true")
class VerifiedPeriodIntegrationTest {
    @Autowired JdbcTemplate db;
    @Autowired UserRepository users;
    @Autowired StudyAnalyticsService analytics;
    @Autowired FocusStatisticsController controller;
    @Autowired ObjectMapper mapper;
    private User user;

    @BeforeEach void setup() {
        assertEquals("studystreak_schema_check", db.queryForObject("select current_database()", String.class));
        assertTrue(db.queryForObject("select current_schema()", String.class).startsWith("ss_audit_"));
        user = newUser("America/Lima");
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user.getUsername(), null, List.of()));
    }

    private User newUser(String zone) {
        User value = new User();
        String name = "verified_" + UUID.randomUUID();
        value.setUsername(name); value.setEmail(name + "@example.invalid");
        value.setPassword("not-used"); value.setRole(Role.USER); value.setTimeZone(zone);
        return users.saveAndFlush(value);
    }

    @AfterEach void clearSecurity() { SecurityContextHolder.clearContext(); }

    private LocalDate today(ZoneId zone) {
        return db.queryForObject("select (clock_timestamp() at time zone ?)::date", LocalDate.class, zone.getId());
    }

    private void session(User owner, String source, String state, boolean verified,
                         int seconds, Instant started, Instant completed) {
        db.update("""
            insert into study_ledger(id,user_id,goal_name,source,state,planned_seconds,
              confirmed_seconds,started_at,last_seen_at,completed_at,verified)
            values (?,?,'Fixture',?,?,7200,?,?,clock_timestamp(),?,?)
            """, UUID.randomUUID(), owner.getId(), source, state, seconds,
                Timestamp.from(started), completed == null ? null : Timestamp.from(completed), verified);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> verified(Map<String, Object> result) {
        return (Map<String, Object>) result.get("verifiedPeriod");
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> daily(Map<String, Object> result) {
        return (List<Map<String, Object>>) verified(result).get("daily");
    }

    private double number(Map<String, Object> row, String key) { return ((Number) row.get(key)).doubleValue(); }

    private void consistent(Map<String, Object> result, int days) {
        var period = verified(result);
        assertEquals(days, daily(result).size());
        assertEquals(number(period, "minutes"), daily(result).stream().mapToDouble(r -> number(r, "minutes")).sum(), 1e-12);
        assertEquals(number(period, "sessions"), daily(result).stream().mapToDouble(r -> number(r, "sessions")).sum());
        assertEquals(Set.of("minutes", "sessions", "daily"), period.keySet());
        daily(result).forEach(row -> assertEquals(Set.of("date", "minutes", "sessions"), row.keySet()));
    }

    @ParameterizedTest @ValueSource(ints = {7, 30})
    void filtersSourcesStatesAndUsersWithoutChangingExistingFields(int days) {
        ZoneId zone = ZoneId.of(user.getTimeZone());
        Instant end = today(zone).atTime(12, 0).atZone(zone).toInstant();
        Instant start = end.minusSeconds(3600);
        session(user, "INDIVIDUAL", "COMPLETE", true, 61, start, end);
        session(user, "GROUP", "COMPLETE", true, 62, start, end);
        session(user, "LEGACY", "COMPLETE", false, 300, start, end);
        session(user, "LEGACY", "COMPLETE", true, 600, start, end);
        session(user, "INDIVIDUAL", "COMPLETE", false, 120, start, end);
        session(user, "INDIVIDUAL", "CANCELLED", true, 120, start, end);
        session(newUser("America/Lima"), "INDIVIDUAL", "COMPLETE", true, 720, start, end);
        var result = controller.stats(days).getBody();
        assertNotNull(result);
        assertEquals(2.05, number(verified(result), "minutes"), 1e-12);
        assertEquals(2, number(verified(result), "sessions"));
        assertEquals(19.05, number(result, "periodMinutes"), 1e-12);
        assertEquals(5, number(result, "periodSessions"));
        assertEquals(3.81, number(result, "averageMinutes"), 1e-12);
        assertEquals(1, number(result, "studyStreak"));
        assertEquals(12.05, number(result, "verifiedMinutes"), 1e-12);
        assertEquals(7, number(result, "estimatedMinutes"));
        var json = mapper.readTree(mapper.writeValueAsString(result));
        assertEquals(2.05, json.path("verifiedPeriod").path("minutes").asDouble(), 1e-12);
        assertTrue(json.path("verifiedPeriod").path("daily").isArray());
        for (String field : List.of("days", "timeZone", "totalMinutes", "completedSessions", "verifiedMinutes",
                "estimatedMinutes", "periodMinutes", "periodSessions", "groupMinutes", "individualMinutes",
                "groupSessions", "previousMinutes", "changePercent", "completionPercent", "averageMinutes",
                "daily", "bestDayMinutes", "activeDays", "activity", "byGoal", "hourly", "weekly", "monthly",
                "weekMinutes", "studyStreak", "bestStudyStreak")) assertTrue(result.containsKey(field), field);
        consistent(result, days);
    }

    @ParameterizedTest @ValueSource(strings = {"RUNNING", "PAUSED", "CANCELLED"})
    void excludesUnfinishedAndCancelledSessions(String state) {
        Instant start = today(ZoneId.of(user.getTimeZone())).atTime(12, 0)
                .atZone(ZoneId.of(user.getTimeZone())).toInstant();
        session(user, "INDIVIDUAL", state, true, 120, start,
                state.equals("CANCELLED") ? start.plusSeconds(120) : null);
        var result = analytics.stats(7);
        assertEquals(0, number(verified(result), "minutes"));
        assertEquals(0, number(verified(result), "sessions"));
        consistent(result, 7);
    }

    @ParameterizedTest @CsvSource({"7,America/Lima", "30,America/Lima", "7,Pacific/Kiritimati", "30,America/New_York"})
    void attributesByCompletionAndUserZoneWithInclusiveStartExclusiveEnd(int days, String zoneName) {
        user.setTimeZone(zoneName); users.saveAndFlush(user);
        ZoneId zone = ZoneId.of(zoneName);
        LocalDate today = today(zone), first = today.minusDays(days - 1);
        Instant start = first.atStartOfDay(zone).toInstant(), until = today.plusDays(1).atStartOfDay(zone).toInstant();
        session(user, "INDIVIDUAL", "COMPLETE", true, 61, start.minusSeconds(86400 * 3), start);
        session(user, "GROUP", "COMPLETE", true, 62, until.minusSeconds(4000), until.minusMillis(1));
        session(user, "INDIVIDUAL", "COMPLETE", true, 300, start.minusSeconds(4000), start.minusMillis(1));
        session(user, "INDIVIDUAL", "COMPLETE", true, 300, until.minusSeconds(4000), until);
        var result = analytics.stats(days);
        assertEquals(zoneName, result.get("timeZone"));
        assertEquals(first.toString(), daily(result).getFirst().get("date"));
        assertEquals(today.toString(), daily(result).getLast().get("date"));
        assertEquals(61 / 60d, number(daily(result).getFirst(), "minutes"), 1e-12);
        assertEquals(62 / 60d, number(daily(result).getLast(), "minutes"), 1e-12);
        assertEquals(2.05, number(verified(result), "minutes"), 1e-12);
        assertEquals(days - 2, daily(result).stream().filter(row -> number(row, "sessions") == 0).count());
        consistent(result, days);
    }

    @ParameterizedTest @ValueSource(ints = {7, 30})
    void emptyAccountsReturnAllDaysAndZeroTotals(int days) {
        var result = analytics.stats(days);
        assertEquals(0, number(verified(result), "minutes"));
        assertEquals(0, number(verified(result), "sessions"));
        assertTrue(daily(result).stream().allMatch(row -> number(row, "minutes") == 0 && number(row, "sessions") == 0));
        consistent(result, days);
    }
}
