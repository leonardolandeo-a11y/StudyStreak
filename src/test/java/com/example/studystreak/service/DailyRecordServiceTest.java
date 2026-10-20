package com.example.studystreak.service;

import com.example.studystreak.exceptions.ForbiddenException;
import com.example.studystreak.model.Goal;
import com.example.studystreak.model.User;
import com.example.studystreak.repository.DailyRecordRepository;
import com.example.studystreak.repository.GoalRepository;
import com.example.studystreak.repository.TrackingLinkRepository;
import org.junit.jupiter.api.Test;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.PageRequest;
import com.example.studystreak.model.TrackingLink;
import com.example.studystreak.model.TrackingStatus;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class DailyRecordServiceTest {

    @Test
    void cannotReadDailyRecordsWithoutAcceptedTrackingLink() {

        DailyRecordRepository dailyRecordRepository =
                mock(DailyRecordRepository.class);

        GoalRepository goalRepository =
                mock(GoalRepository.class);

        CurrentUserService currentUserService =
                mock(CurrentUserService.class);

        TrackingLinkRepository trackingLinkRepository =
                mock(TrackingLinkRepository.class);

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

        when(trackingLinkRepository.findLinkBetweenUsers(2L, 1L))
                .thenReturn(Optional.empty());

        DailyRecordService service =
                new DailyRecordService(
                        dailyRecordRepository,
                        new ModelMapper(),
                        goalRepository,
                        currentUserService,
                        trackingLinkRepository
                );

        assertThrows(
                ForbiddenException.class,
                () -> service.getGoalDailyRecords(
                        1L,
                        PageRequest.of(0, 20)
                )
        );
    }
    @Test
    void canReadDailyRecordsWithAcceptedTrackingLink() {

        DailyRecordRepository dailyRecordRepository =
                mock(DailyRecordRepository.class);

        GoalRepository goalRepository =
                mock(GoalRepository.class);

        CurrentUserService currentUserService =
                mock(CurrentUserService.class);

        TrackingLinkRepository trackingLinkRepository =
                mock(TrackingLinkRepository.class);

        Goal goal = mock(Goal.class);
        User owner = mock(User.class);
        TrackingLink trackingLink = mock(TrackingLink.class);

        when(goalRepository.findById(1L))
                .thenReturn(Optional.of(goal));

        when(goal.getUser())
                .thenReturn(owner);

        when(owner.getId())
                .thenReturn(1L);

        when(currentUserService.getCurrentUserId())
                .thenReturn(2L);

        when(trackingLinkRepository.findLinkBetweenUsers(2L, 1L))
                .thenReturn(Optional.of(trackingLink));

        when(trackingLink.getStatus())
                .thenReturn(TrackingStatus.ACCEPTED);

        PageRequest pageable =
                PageRequest.of(0, 20);

        when(dailyRecordRepository.findByGoalId(1L, pageable))
                .thenReturn(
                        org.springframework.data.domain.Page.empty()
                );

        DailyRecordService service =
                new DailyRecordService(
                        dailyRecordRepository,
                        new ModelMapper(),
                        goalRepository,
                        currentUserService,
                        trackingLinkRepository
                );

        assertDoesNotThrow(
                () -> service.getGoalDailyRecords(
                        1L,
                        pageable
                )
        );
    }
    @Test
    void cannotReadDailyRecordsWithPendingTrackingLink() {

        DailyRecordRepository dailyRecordRepository =
                mock(DailyRecordRepository.class);

        GoalRepository goalRepository =
                mock(GoalRepository.class);

        CurrentUserService currentUserService =
                mock(CurrentUserService.class);

        TrackingLinkRepository trackingLinkRepository =
                mock(TrackingLinkRepository.class);

        Goal goal = mock(Goal.class);
        User owner = mock(User.class);
        TrackingLink trackingLink = mock(TrackingLink.class);

        when(goalRepository.findById(1L))
                .thenReturn(Optional.of(goal));

        when(goal.getUser())
                .thenReturn(owner);

        when(owner.getId())
                .thenReturn(1L);

        when(currentUserService.getCurrentUserId())
                .thenReturn(2L);

        when(trackingLinkRepository.findLinkBetweenUsers(2L, 1L))
                .thenReturn(Optional.of(trackingLink));

        when(trackingLink.getStatus())
                .thenReturn(TrackingStatus.PENDING);

        DailyRecordService service =
                new DailyRecordService(
                        dailyRecordRepository,
                        new ModelMapper(),
                        goalRepository,
                        currentUserService,
                        trackingLinkRepository
                );

        assertThrows(
                ForbiddenException.class,
                () -> service.getGoalDailyRecords(
                        1L,
                        PageRequest.of(0, 20)
                )
        );
    }
    @Test
    void cannotReadDailyRecordsWithRejectedTrackingLink() {

        DailyRecordRepository dailyRecordRepository =
                mock(DailyRecordRepository.class);

        GoalRepository goalRepository =
                mock(GoalRepository.class);

        CurrentUserService currentUserService =
                mock(CurrentUserService.class);

        TrackingLinkRepository trackingLinkRepository =
                mock(TrackingLinkRepository.class);

        Goal goal = mock(Goal.class);
        User owner = mock(User.class);
        TrackingLink trackingLink = mock(TrackingLink.class);

        when(goalRepository.findById(1L))
                .thenReturn(Optional.of(goal));

        when(goal.getUser())
                .thenReturn(owner);

        when(owner.getId())
                .thenReturn(1L);

        when(currentUserService.getCurrentUserId())
                .thenReturn(2L);

        when(trackingLinkRepository.findLinkBetweenUsers(2L, 1L))
                .thenReturn(Optional.of(trackingLink));

        when(trackingLink.getStatus())
                .thenReturn(TrackingStatus.REJECTED);

        DailyRecordService service =
                new DailyRecordService(
                        dailyRecordRepository,
                        new ModelMapper(),
                        goalRepository,
                        currentUserService,
                        trackingLinkRepository
                );

        assertThrows(
                ForbiddenException.class,
                () -> service.getGoalDailyRecords(
                        1L,
                        PageRequest.of(0, 20)
                )
        );
    }
    @Test
    void acceptedTrackingPartnerCannotDeleteDailyRecord() {

        DailyRecordRepository dailyRecordRepository =
                mock(DailyRecordRepository.class);

        GoalRepository goalRepository =
                mock(GoalRepository.class);

        CurrentUserService currentUserService =
                mock(CurrentUserService.class);

        TrackingLinkRepository trackingLinkRepository =
                mock(TrackingLinkRepository.class);

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
                        currentUserService,
                        trackingLinkRepository
                );

        assertThrows(
                ForbiddenException.class,
                () -> service.deleteDailyRecord(
                        1L,
                        1L
                )
        );
    }

}