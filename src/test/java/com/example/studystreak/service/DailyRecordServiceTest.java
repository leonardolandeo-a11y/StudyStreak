package com.example.studystreak.service;

import com.example.studystreak.exceptions.ForbiddenException;
import com.example.studystreak.model.Goal;
import com.example.studystreak.model.User;
import com.example.studystreak.repository.DailyRecordRepository;
import com.example.studystreak.repository.GoalRepository;
import com.example.studystreak.repository.TrackingLinkRepository;
import com.example.studystreak.repository.DailyRecordPhotoRepository;
import com.example.studystreak.repository.DailyRecordVoiceRepository;
import com.example.studystreak.repository.NotificationRepository;
import com.example.studystreak.repository.ValidationRepository;
import com.example.studystreak.model.DailyRecord;
import org.mockito.InOrder;
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
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.verifyNoInteractions;

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
                        trackingLinkRepository,
                        mock(com.example.studystreak.repository.DailyRecordPhotoRepository.class),
                        mock(com.example.studystreak.repository.DailyRecordVoiceRepository.class),
                        mock(NotificationRepository.class),
                        mock(ValidationRepository.class),
                        mock(StreakService.class)
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
                        trackingLinkRepository,
                        mock(com.example.studystreak.repository.DailyRecordPhotoRepository.class),
                        mock(com.example.studystreak.repository.DailyRecordVoiceRepository.class),
                        mock(NotificationRepository.class),
                        mock(ValidationRepository.class),
                        mock(StreakService.class)
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
                        trackingLinkRepository,
                        mock(com.example.studystreak.repository.DailyRecordPhotoRepository.class),
                        mock(com.example.studystreak.repository.DailyRecordVoiceRepository.class),
                        mock(NotificationRepository.class),
                        mock(ValidationRepository.class),
                        mock(StreakService.class)
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
                        trackingLinkRepository,
                        mock(com.example.studystreak.repository.DailyRecordPhotoRepository.class),
                        mock(com.example.studystreak.repository.DailyRecordVoiceRepository.class),
                        mock(NotificationRepository.class),
                        mock(ValidationRepository.class),
                        mock(StreakService.class)
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
                        trackingLinkRepository,
                        mock(com.example.studystreak.repository.DailyRecordPhotoRepository.class),
                        mock(com.example.studystreak.repository.DailyRecordVoiceRepository.class),
                        mock(NotificationRepository.class),
                        mock(ValidationRepository.class),
                        mock(StreakService.class)
                );

        assertThrows(
                ForbiddenException.class,
                () -> service.deleteDailyRecord(
                        1L,
                        1L
                )
        );
    }


    @Test
    void deletingApprovedRecordRemovesDependenciesBeforeRecalculatingStreak() {
        Long goalId = 104L;
        Long recordId = 105L;
        DailyRecordRepository records = mock(DailyRecordRepository.class);
        DailyRecordPhotoRepository photos = mock(DailyRecordPhotoRepository.class);
        DailyRecordVoiceRepository voices = mock(DailyRecordVoiceRepository.class);
        ValidationRepository validations = mock(ValidationRepository.class);
        NotificationRepository notifications = mock(NotificationRepository.class);
        StreakService streaks = mock(StreakService.class);
        GoalRepository goals = mock(GoalRepository.class);
        CurrentUserService userService = mock(CurrentUserService.class);
        Goal goal = mock(Goal.class);
        User owner = mock(User.class);
        DailyRecord record = mock(DailyRecord.class);

        when(goals.findById(goalId)).thenReturn(Optional.of(goal));
        when(goal.getUser()).thenReturn(owner);
        when(owner.getId()).thenReturn(1L);
        when(userService.getCurrentUserId()).thenReturn(1L);
        when(records.findById(recordId)).thenReturn(Optional.of(record));
        when(record.getGoal()).thenReturn(goal);
        when(goal.getId()).thenReturn(goalId);
        when(records.deleteOwnedRecord(goalId, recordId)).thenReturn(1);

        DailyRecordService service = new DailyRecordService(
                records, new ModelMapper(), goals, userService,
                mock(TrackingLinkRepository.class), photos, voices,
                notifications, validations, streaks
        );

        service.deleteDailyRecord(goalId, recordId);

        InOrder order = inOrder(notifications, photos, voices, validations, records, streaks);
        order.verify(notifications).clearDeletedDailyRecordReferences(recordId);
        order.verify(photos).deleteByDailyRecordId(recordId);
        order.verify(voices).deleteByDailyRecordId(recordId);
        order.verify(validations).deleteForDailyRecord(recordId);
        order.verify(records).deleteOwnedRecord(goalId, recordId);
        order.verify(streaks).recalculateStreak(goalId);
    }

    @Test
    void anotherUserCannotDeleteAnApprovedRecord() {
        DailyRecordRepository records = mock(DailyRecordRepository.class);
        GoalRepository goals = mock(GoalRepository.class);
        CurrentUserService userService = mock(CurrentUserService.class);
        NotificationRepository notifications = mock(NotificationRepository.class);
        ValidationRepository validations = mock(ValidationRepository.class);
        StreakService streaks = mock(StreakService.class);
        Goal goal = mock(Goal.class);
        User owner = mock(User.class);

        when(goals.findById(104L)).thenReturn(Optional.of(goal));
        when(goal.getUser()).thenReturn(owner);
        when(owner.getId()).thenReturn(1L);
        when(userService.getCurrentUserId()).thenReturn(2L);

        DailyRecordService service = new DailyRecordService(
                records, new ModelMapper(), goals, userService,
                mock(TrackingLinkRepository.class),
                mock(DailyRecordPhotoRepository.class),
                mock(DailyRecordVoiceRepository.class),
                notifications, validations, streaks
        );

        assertThrows(ForbiddenException.class,
                () -> service.deleteDailyRecord(104L, 105L));
        verifyNoInteractions(notifications, validations, streaks);
    }
}
