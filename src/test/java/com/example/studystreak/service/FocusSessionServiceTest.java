package com.example.studystreak.service;

import com.example.studystreak.dto.Focus.FocusSessionRequestDTO;
import com.example.studystreak.exceptions.ForbiddenException;
import com.example.studystreak.model.FocusSession;
import com.example.studystreak.model.Goal;
import com.example.studystreak.model.User;
import com.example.studystreak.repository.FocusSessionRepository;
import com.example.studystreak.repository.GoalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class FocusSessionServiceTest {
    private final CurrentUserService currentUser = mock(CurrentUserService.class);
    private final GoalRepository goals = mock(GoalRepository.class);
    private final FocusSessionRepository sessions = mock(FocusSessionRepository.class);
    private final FocusSessionService service = new FocusSessionService(currentUser, goals, sessions);
    private final Goal goal = mock(Goal.class);

    @BeforeEach
    void ownedGoal() {
        User user = mock(User.class);
        when(user.getId()).thenReturn(12L);
        when(goal.getId()).thenReturn(42L);
        when(goal.getUser()).thenReturn(user);
        when(goals.findById(42L)).thenReturn(Optional.of(goal));
        when(currentUser.getCurrentUserId()).thenReturn(12L);
    }

    @Test
    void completesFocusAndCountsOnlyOnceForSameUuid() {
        UUID id = UUID.randomUUID();
        when(sessions.findById(id)).thenReturn(Optional.empty());
        when(sessions.saveAndFlush(any(FocusSession.class))).thenAnswer(inv -> inv.getArgument(0));

        var saved = service.recordCompletion(42L, new FocusSessionRequestDTO(id, 25));
        assertEquals(id, saved.sessionId());
        assertEquals(42L, saved.goalId());
        assertEquals(25, saved.durationMinutes());
        verify(sessions).saveAndFlush(any(FocusSession.class));

        FocusSession existing = new FocusSession(id, goal, 25, Instant.now());
        when(sessions.findById(id)).thenReturn(Optional.of(existing));
        var retried = service.recordCompletion(42L, new FocusSessionRequestDTO(id, 25));
        assertEquals(id, retried.sessionId());
        verify(sessions, times(1)).saveAndFlush(any(FocusSession.class));
    }

    @Test
    void rejectsOtherUsersAndNeverPersistsTheirMinutes() {
        when(currentUser.getCurrentUserId()).thenReturn(88L);
        assertThrows(ForbiddenException.class, () ->
                service.recordCompletion(42L, new FocusSessionRequestDTO(UUID.randomUUID(), 25)));
        assertThrows(ForbiddenException.class, () -> service.summary(42L));
        verifyNoInteractions(sessions);
    }

    @Test
    void preventsSessionIdReuseForDifferentDuration() {
        UUID id = UUID.randomUUID();
        when(sessions.findById(id)).thenReturn(Optional.of(new FocusSession(id, goal, 20, Instant.now())));
        assertThrows(ResponseStatusException.class,
                () -> service.recordCompletion(42L, new FocusSessionRequestDTO(id, 50)));
        verify(sessions, never()).saveAndFlush(any(FocusSession.class));
    }

    @Test
    void restrictsRecordedMinutesToAllowedFocusIntervals() {
        for (int minutes : new int[]{0, 4, 121}) {
            assertThrows(ResponseStatusException.class,
                    () -> service.recordCompletion(42L, new FocusSessionRequestDTO(UUID.randomUUID(), minutes)));
        }
        verifyNoInteractions(sessions);
    }

    @Test
    void readsOwnerSummary() {
        when(sessions.sumMinutesByGoalId(42L)).thenReturn(130L);
        when(sessions.countByGoalId(42L)).thenReturn(5L);
        var summary = service.summary(42L);
        assertEquals(130L, summary.totalMinutes());
        assertEquals(5L, summary.completedSessions());
    }
}
