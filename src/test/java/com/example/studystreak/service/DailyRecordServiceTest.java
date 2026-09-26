package com.example.studystreak.service;

import com.example.studystreak.exceptions.ForbiddenException;
import com.example.studystreak.model.Goal;
import com.example.studystreak.model.User;
import com.example.studystreak.repository.DailyRecordRepository;
import com.example.studystreak.repository.GoalRepository;
import org.junit.jupiter.api.Test;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.PageRequest;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class DailyRecordServiceTest {

    @Test
    void cannotReadDailyRecordsFromAnotherUsersGoal() {

        DailyRecordRepository dailyRecordRepository =
                mock(DailyRecordRepository.class);

        GoalRepository goalRepository =
                mock(GoalRepository.class);

        CurrentUserService currentUserService =
                mock(CurrentUserService.class);

        Goal goal = mock(Goal.class);
        User owner = mock(User.class);

        when(goalRepository.findById(1L))
                .thenReturn(Optional.of(goal));

        when(goal.getUser())
                .thenReturn(owner);

        when(owner.getId())
                .thenReturn(1L);

        when(currentUserService.getCurrentUserId())
                .thenReturn(2L);

        DailyRecordService service =
                new DailyRecordService(
                        dailyRecordRepository,
                        new ModelMapper(),
                        goalRepository,
                        currentUserService
                );

        assertThrows(
                ForbiddenException.class,
                () -> service.getGoalDailyRecords(
                        1L,
                        PageRequest.of(0, 20)
                )
        );
    }
}