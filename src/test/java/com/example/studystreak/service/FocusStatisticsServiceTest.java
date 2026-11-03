package com.example.studystreak.service;

import com.example.studystreak.model.FocusSession;
import com.example.studystreak.model.Goal;
import com.example.studystreak.model.User;
import com.example.studystreak.repository.FocusSessionRepository;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class FocusStatisticsServiceTest {
    private final CurrentUserService currentUser = mock(CurrentUserService.class);
    private final FocusSessionRepository repository = mock(FocusSessionRepository.class);
    private final FocusStatisticsService service = new FocusStatisticsService(currentUser, repository);

    @Test
    void correctlyAggregatesSevenDaySeriesInAccountTimeZone() {
        ZoneId zone = ZoneId.of("America/Lima");
        User user = mock(User.class);
        when(user.getId()).thenReturn(8L);
        when(user.getTimeZone()).thenReturn(zone.getId());
        when(currentUser.getCurrentUser()).thenReturn(user);

        LocalDate today = LocalDate.now(zone);
        Goal goal = mock(Goal.class);
        FocusSession todayOne = new FocusSession(java.util.UUID.randomUUID(), goal, 25,
                today.atTime(9, 0).atZone(zone).toInstant());
        FocusSession todayTwo = new FocusSession(java.util.UUID.randomUUID(), goal, 15,
                today.atTime(11, 0).atZone(zone).toInstant());
        FocusSession yesterday = new FocusSession(java.util.UUID.randomUUID(), goal, 50,
                today.minusDays(1).atTime(23, 30).atZone(zone).toInstant());

        when(repository.findRecentForUser(eq(8L), any(Instant.class)))
                .thenReturn(List.of(todayOne, todayTwo, yesterday));
        when(repository.sumMinutesForUser(8L)).thenReturn(350L);
        when(repository.countForUser(8L)).thenReturn(12L);
        when(repository.totalsByGoalForUser(8L))
                .thenReturn(List.<Object[]>of(new Object[]{12L, "Calculus", 350L, 12L}));

        var report = service.getStatistics(7);
        assertEquals(7, report.daily().size());
        assertEquals(today.minusDays(6), report.daily().get(0).date());
        assertEquals(today, report.daily().get(6).date());
        assertEquals(40L, report.daily().get(6).minutes());
        assertEquals(2L, report.daily().get(6).sessions());
        assertEquals(50L, report.daily().get(5).minutes());
        assertEquals(90L, report.periodMinutes());
        assertEquals(3L, report.periodSessions());
        assertEquals(50L, report.bestDayMinutes());
        assertEquals(350L, report.totalMinutes());
        assertEquals(12L, report.completedSessions());
        assertEquals("Calculus", report.byGoal().get(0).topic());
        verify(repository).findRecentForUser(eq(8L), eq(today.minusDays(6).atStartOfDay(zone).toInstant()));
    }

    @Test
    void emptyHistoryReturnsThirtyZeroDays() {
        User user = mock(User.class);
        when(user.getId()).thenReturn(2L);
        when(currentUser.getCurrentUser()).thenReturn(user);
        when(repository.findRecentForUser(eq(2L), any())).thenReturn(List.of());
        when(repository.sumMinutesForUser(2L)).thenReturn(0L);
        when(repository.totalsByGoalForUser(2L)).thenReturn(List.of());

        var report = service.getStatistics(30);
        assertEquals(30, report.daily().size());
        assertEquals(0, report.periodMinutes());
        assertEquals(0, report.completedSessions());
        assertTrue(report.byGoal().isEmpty());
        assertTrue(report.daily().stream().allMatch(day -> day.minutes() == 0));
    }

    @Test
    void invalidPeriodIsRejectedBeforeQueryingAnyRecords() {
        assertThrows(ResponseStatusException.class, () -> service.getStatistics(1));
        assertThrows(ResponseStatusException.class, () -> service.getStatistics(365));
        verifyNoInteractions(repository, currentUser);
    }
}
