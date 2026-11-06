package com.example.studystreak.service;

import com.example.studystreak.dto.Focus.FocusSessionRequestDTO;
import com.example.studystreak.exceptions.ForbiddenException;
import com.example.studystreak.model.Goal;
import com.example.studystreak.model.User;
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
    private final StudyLedgerService ledger = mock(StudyLedgerService.class);
    private final FocusSessionService service = new FocusSessionService(currentUser, goals, ledger);
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
    void completesFocusOnlyThroughServerValidatedLedger() {
        UUID id=UUID.randomUUID(); Instant time=Instant.now();
        when(ledger.complete(42L,id,25)).thenReturn(java.util.Map.of("confirmed_seconds",1500,"completed_at",java.sql.Timestamp.from(time)));
        var saved=service.recordCompletion(42L,new FocusSessionRequestDTO(id,25));
        assertEquals(id,saved.sessionId());assertEquals(25,saved.durationMinutes());assertEquals(time,saved.completedAt());
        verify(ledger).complete(42L,id,25);
    }

    @Test
    void rejectsOtherUsersAndNeverPersistsTheirMinutes() {
        when(currentUser.getCurrentUserId()).thenReturn(88L);
        assertThrows(ForbiddenException.class, () ->
                service.recordCompletion(42L, new FocusSessionRequestDTO(UUID.randomUUID(), 25)));
        assertThrows(ForbiddenException.class, () -> service.summary(42L));
        verifyNoInteractions(ledger);
    }

    @Test
    void preventsSessionIdReuseForDifferentDuration() {
        UUID id = UUID.randomUUID();
        when(ledger.complete(42L,id,50)).thenThrow(new ResponseStatusException(org.springframework.http.HttpStatus.CONFLICT));
        assertThrows(ResponseStatusException.class, () -> service.recordCompletion(42L,new FocusSessionRequestDTO(id,50)));
    }

    @Test
    void restrictsRecordedMinutesToAllowedFocusIntervals() {
        for (int minutes : new int[]{0, 4, 121}) {
            assertThrows(ResponseStatusException.class,
                    () -> service.recordCompletion(42L, new FocusSessionRequestDTO(UUID.randomUUID(), minutes)));
        }
        verifyNoInteractions(ledger);
    }

    @Test
    void readsOwnerSummary() {
        when(ledger.summary(42L)).thenReturn(java.util.Map.of("totalMinutes",130L,"completedSessions",5L));
        var summary = service.summary(42L);
        assertEquals(130L, summary.totalMinutes());
        assertEquals(5L, summary.completedSessions());
    }
}
