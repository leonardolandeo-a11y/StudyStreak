package com.example.studystreak.service;

import com.example.studystreak.model.User;
import com.example.studystreak.repository.DailyRecordRepository;
import com.example.studystreak.repository.GoalRepository;
import com.example.studystreak.repository.StreakRepository;
import com.example.studystreak.repository.ValidationRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class DashboardServiceTest {

    private final CurrentUserService currentUserService = mock(CurrentUserService.class);
    private final GoalRepository goalRepository = mock(GoalRepository.class);
    private final StreakRepository streakRepository = mock(StreakRepository.class);
    private final DailyRecordRepository dailyRecordRepository = mock(DailyRecordRepository.class);
    private final ValidationRepository validationRepository = mock(ValidationRepository.class);
    private final StreakService streakService = mock(StreakService.class);

    private final DashboardService service = new DashboardService(
            currentUserService,
            goalRepository,
            streakRepository,
            dailyRecordRepository,
            validationRepository,
            streakService
    );

    @Test
    void countsActiveAndCompletedGoals() {
        when(currentUserService.getCurrentUserId()).thenReturn(9L);
        when(goalRepository.countByUserId(9L)).thenReturn(5L);
        when(goalRepository.countByUserIdAndCompletedTrue(9L)).thenReturn(2L);

        var result = service.getGoalSummary();

        assertEquals(3L, result.active());
        assertEquals(2L, result.completed());
    }

    @Test
    void findsHighestStreaks() {
        User user = mock(User.class);
        when(user.getId()).thenReturn(9L);
        when(user.getTimeZone()).thenReturn("America/Lima");
        when(currentUserService.getCurrentUser()).thenReturn(user);
        LocalDate today = StudyDatePolicy.today(user);
        when(goalRepository.findGoalsWithOutdatedStreaks(9L, today)).thenReturn(java.util.List.of(3L));
        when(streakRepository.findHighestCurrentStreak(9L)).thenReturn(6);
        when(streakRepository.findHighestBestStreak(9L)).thenReturn(12);

        var result = service.getStreakSummary();

        assertEquals(6, result.current());
        assertEquals(12, result.best());
        org.mockito.Mockito.verify(streakService).recalculateStreak(3L);
    }

    @Test
    void countsRecordsUsingUsersTimeZone() {
        User user = mock(User.class);
        when(user.getId()).thenReturn(9L);
        when(user.getTimeZone()).thenReturn("America/Lima");
        when(currentUserService.getCurrentUser()).thenReturn(user);
        LocalDate today = LocalDate.now(ZoneId.of("America/Lima"));
        when(dailyRecordRepository.countByGoal_User_IdAndDateBetween(9L, today.minusDays(6), today))
                .thenReturn(4L);

        assertEquals(4L, service.getRecordSummary().lastSevenDays());
    }

    @Test
    void countsReviewedAndUnreviewedRecords() {
        when(currentUserService.getCurrentUserId()).thenReturn(9L);
        when(validationRepository.countReviewedByRecordOwnerId(9L)).thenReturn(3L);
        when(dailyRecordRepository.countAwaitingReviewByUserId(9L)).thenReturn(2L);

        var result = service.getValidationSummary();

        assertEquals(3L, result.reviewed());
        assertEquals(2L, result.awaitingReview());
    }
}
