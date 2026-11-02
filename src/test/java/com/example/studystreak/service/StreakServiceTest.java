package com.example.studystreak.service;

import com.example.studystreak.dto.Streak.StreakDTO;
import com.example.studystreak.model.DailyRecord;
import com.example.studystreak.model.Goal;
import com.example.studystreak.model.Streak;
import com.example.studystreak.model.User;
import com.example.studystreak.model.Validation;
import com.example.studystreak.repository.DailyRecordRepository;
import com.example.studystreak.repository.GoalRepository;
import com.example.studystreak.repository.StreakRepository;
import org.junit.jupiter.api.Test;
import org.modelmapper.ModelMapper;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class StreakServiceTest {
    private final StreakRepository streaks = mock(StreakRepository.class);
    private final GoalRepository goals = mock(GoalRepository.class);
    private final DailyRecordRepository records = mock(DailyRecordRepository.class);
    private final ModelMapper mapper = mock(ModelMapper.class);
    private final CurrentUserService currentUser = mock(CurrentUserService.class);
    private final StreakService service = new StreakService(streaks, goals, records, mapper, currentUser);

    private LocalDate setUpGoal() {
        Goal goal = mock(Goal.class);
        User owner = mock(User.class);
        when(goal.getUser()).thenReturn(owner);
        when(owner.getId()).thenReturn(3L);
        when(owner.getTimeZone()).thenReturn("America/Lima");
        when(currentUser.getCurrentUserId()).thenReturn(3L);
        when(goals.findById(7L)).thenReturn(Optional.of(goal));
        return StudyDatePolicy.today(owner);
    }

    private DailyRecord approvedRecord(LocalDate date) {
        DailyRecord record = mock(DailyRecord.class);
        Validation validation = mock(Validation.class);
        when(record.getDate()).thenReturn(date);
        when(record.getValidation()).thenReturn(validation);
        when(validation.getApproved()).thenReturn(true);
        return record;
    }

    @Test
    void cachedStreakIsRecalculatedAfterItsCalculationDay() {
        LocalDate today = setUpGoal();
        Streak streak = mock(Streak.class);
        when(streak.getLastUpdateDate()).thenReturn(today.minusDays(2));
        when(streaks.findByGoalId(7L)).thenReturn(Optional.of(streak));
        when(streaks.save(streak)).thenReturn(streak);
        List<DailyRecord> approvedRecords = List.of(approvedRecord(today.minusDays(3)));
        when(records.findByGoalId(7L)).thenReturn(approvedRecords);
        StreakDTO mappedStreak = mock(StreakDTO.class);
        when(mapper.map(eq(streak), eq(StreakDTO.class))).thenReturn(mappedStreak);

        service.getGoalStreak(7L);

        verify(streak).setCurrentStreak(0);
        verify(streak).setBestStreak(1);
        verify(streak).setLastUpdateDate(today);
        verify(streaks).save(streak);
    }

    @Test
    void yesterdayApprovalKeepsTheStreakAlive() {
        LocalDate today = setUpGoal();
        when(streaks.findByGoalId(7L)).thenReturn(Optional.empty());
        List<DailyRecord> approvedRecords = List.of(
                approvedRecord(today.minusDays(2)), approvedRecord(today.minusDays(1)));
        when(records.findByGoalId(7L)).thenReturn(approvedRecords);
        when(streaks.save(any(Streak.class))).thenAnswer(invocation -> invocation.getArgument(0));
        StreakDTO mappedStreak = mock(StreakDTO.class);
        when(mapper.map(any(Streak.class), eq(StreakDTO.class))).thenReturn(mappedStreak);

        service.recalculateStreak(7L);

        org.mockito.ArgumentCaptor<Streak> saved = org.mockito.ArgumentCaptor.forClass(Streak.class);
        verify(streaks).save(saved.capture());
        assertEquals(2, saved.getValue().getCurrentStreak());
        assertEquals(2, saved.getValue().getBestStreak());
        assertEquals(today, saved.getValue().getLastUpdateDate());
    }

    @Test
    void alreadyUpdatedStreakDoesNotQueryRecordsAgain() {
        LocalDate today = setUpGoal();
        Streak streak = mock(Streak.class);
        when(streak.getLastUpdateDate()).thenReturn(today);
        when(streaks.findByGoalId(7L)).thenReturn(Optional.of(streak));
        StreakDTO mappedStreak = mock(StreakDTO.class);
        when(mapper.map(streak, StreakDTO.class)).thenReturn(mappedStreak);

        service.getGoalStreak(7L);

        verifyNoInteractions(records);
        verify(streaks, never()).save(any(Streak.class));
    }
}
