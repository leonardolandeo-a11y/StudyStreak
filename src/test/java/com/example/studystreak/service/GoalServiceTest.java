package com.example.studystreak.service;

import com.example.studystreak.exceptions.ForbiddenException;
import com.example.studystreak.model.TrackingLink;
import com.example.studystreak.model.TrackingStatus;
import com.example.studystreak.repository.GoalRepository;
import com.example.studystreak.repository.TrackingLinkRepository;
import com.example.studystreak.repository.UserRepository;

import org.junit.jupiter.api.Test;
import org.modelmapper.ModelMapper;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import com.example.studystreak.model.Goal;
import com.example.studystreak.model.User;

class GoalServiceTest {

    @Test
    void cannotReadGoalsWithoutAcceptedTrackingLink() {

        GoalRepository goalRepository =
                mock(GoalRepository.class);

        UserRepository userRepository =
                mock(UserRepository.class);

        CurrentUserService currentUserService =
                mock(CurrentUserService.class);

        ApplicationEventPublisher eventPublisher =
                mock(ApplicationEventPublisher.class);

        TrackingLinkRepository trackingLinkRepository =
                mock(TrackingLinkRepository.class);

        when(currentUserService.getCurrentUserId())
                .thenReturn(2L);

        when(trackingLinkRepository.findLinkBetweenUsers(2L, 1L))
                .thenReturn(Optional.empty());

        GoalService service =
                new GoalService(
                        goalRepository,
                        new ModelMapper(),
                        userRepository,
                        currentUserService,
                        eventPublisher,
                        trackingLinkRepository
                );

        assertThrows(
                ForbiddenException.class,
                () -> service.getUserGoals(
                        1L,
                        PageRequest.of(0, 20)
                )
        );
    }

    @Test
    void canReadGoalsWithAcceptedTrackingLink() {

        GoalRepository goalRepository =
                mock(GoalRepository.class);

        UserRepository userRepository =
                mock(UserRepository.class);

        CurrentUserService currentUserService =
                mock(CurrentUserService.class);

        ApplicationEventPublisher eventPublisher =
                mock(ApplicationEventPublisher.class);

        TrackingLinkRepository trackingLinkRepository =
                mock(TrackingLinkRepository.class);

        TrackingLink trackingLink =
                mock(TrackingLink.class);

        PageRequest pageable =
                PageRequest.of(0, 20);

        when(currentUserService.getCurrentUserId())
                .thenReturn(2L);

        when(trackingLinkRepository.findLinkBetweenUsers(2L, 1L))
                .thenReturn(Optional.of(trackingLink));

        when(trackingLink.getStatus())
                .thenReturn(TrackingStatus.ACCEPTED);

        when(goalRepository.findByUserId(1L, pageable))
                .thenReturn(Page.empty());

        GoalService service =
                new GoalService(
                        goalRepository,
                        new ModelMapper(),
                        userRepository,
                        currentUserService,
                        eventPublisher,
                        trackingLinkRepository
                );

        assertDoesNotThrow(
                () -> service.getUserGoals(
                        1L,
                        pageable
                )
        );
    }
    @Test
    void cannotReadGoalsWithPendingTrackingLink() {

        GoalRepository goalRepository =
                mock(GoalRepository.class);

        UserRepository userRepository =
                mock(UserRepository.class);

        CurrentUserService currentUserService =
                mock(CurrentUserService.class);

        ApplicationEventPublisher eventPublisher =
                mock(ApplicationEventPublisher.class);

        TrackingLinkRepository trackingLinkRepository =
                mock(TrackingLinkRepository.class);

        TrackingLink trackingLink =
                mock(TrackingLink.class);

        when(currentUserService.getCurrentUserId())
                .thenReturn(2L);

        when(trackingLinkRepository.findLinkBetweenUsers(2L, 1L))
                .thenReturn(Optional.of(trackingLink));

        when(trackingLink.getStatus())
                .thenReturn(TrackingStatus.PENDING);

        GoalService service =
                new GoalService(
                        goalRepository,
                        new ModelMapper(),
                        userRepository,
                        currentUserService,
                        eventPublisher,
                        trackingLinkRepository
                );

        assertThrows(
                ForbiddenException.class,
                () -> service.getUserGoals(
                        1L,
                        PageRequest.of(0, 20)
                )
        );
    }
    @Test
    void cannotReadGoalsWithRejectedTrackingLink() {

        GoalRepository goalRepository =
                mock(GoalRepository.class);

        UserRepository userRepository =
                mock(UserRepository.class);

        CurrentUserService currentUserService =
                mock(CurrentUserService.class);

        ApplicationEventPublisher eventPublisher =
                mock(ApplicationEventPublisher.class);

        TrackingLinkRepository trackingLinkRepository =
                mock(TrackingLinkRepository.class);

        TrackingLink trackingLink =
                mock(TrackingLink.class);

        when(currentUserService.getCurrentUserId())
                .thenReturn(2L);

        when(trackingLinkRepository.findLinkBetweenUsers(2L, 1L))
                .thenReturn(Optional.of(trackingLink));

        when(trackingLink.getStatus())
                .thenReturn(TrackingStatus.REJECTED);

        GoalService service =
                new GoalService(
                        goalRepository,
                        new ModelMapper(),
                        userRepository,
                        currentUserService,
                        eventPublisher,
                        trackingLinkRepository
                );

        assertThrows(
                ForbiddenException.class,
                () -> service.getUserGoals(
                        1L,
                        PageRequest.of(0, 20)
                )
        );
    }
    @Test
    void acceptedTrackingPartnerCannotDeleteGoal() {

        GoalRepository goalRepository =
                mock(GoalRepository.class);

        UserRepository userRepository =
                mock(UserRepository.class);

        CurrentUserService currentUserService =
                mock(CurrentUserService.class);

        ApplicationEventPublisher eventPublisher =
                mock(ApplicationEventPublisher.class);

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

        GoalService service =
                new GoalService(
                        goalRepository,
                        new ModelMapper(),
                        userRepository,
                        currentUserService,
                        eventPublisher,
                        trackingLinkRepository
                );

        assertThrows(
                ForbiddenException.class,
                () -> service.deleteGoal(1L)
        );
    }
}