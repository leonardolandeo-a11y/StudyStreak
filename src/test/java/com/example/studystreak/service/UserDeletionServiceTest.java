package com.example.studystreak.service;

import com.example.studystreak.exceptions.ConflictException;
import com.example.studystreak.exceptions.ResourceNotFoundException;
import com.example.studystreak.model.User;
import com.example.studystreak.repository.GoalRepository;
import com.example.studystreak.repository.NotificationRepository;
import com.example.studystreak.repository.TrackingLinkRepository;
import com.example.studystreak.repository.UserRepository;
import com.example.studystreak.repository.ValidationRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

class UserDeletionServiceTest {
    private final UserRepository users = mock(UserRepository.class);
    private final GoalRepository goals = mock(GoalRepository.class);
    private final ValidationRepository validations = mock(ValidationRepository.class);
    private final TrackingLinkRepository links = mock(TrackingLinkRepository.class);
    private final NotificationRepository notifications = mock(NotificationRepository.class);
    private final UserDeletionService service = new UserDeletionService(users, goals, validations, links, notifications);
    private final User user = mock(User.class);

    private void existingUser() {
        when(users.findByIdForUpdate(7L)).thenReturn(Optional.of(user));
    }

    @Test
    void accountWithNoDependenciesRemovesNotificationsBeforeDeletingUser() {
        existingUser();
        service.deleteUser(7L);

        var order = inOrder(users, notifications);
        order.verify(users).findByIdForUpdate(7L);
        order.verify(notifications).deleteForUser(7L);
        order.verify(users).delete(user);
    }

    @Test
    void accountWithGoalsIsNotDeleted() {
        existingUser();
        when(goals.existsByUserId(7L)).thenReturn(true);

        assertThrows(ConflictException.class, () -> service.deleteUser(7L));
        verifyNoInteractions(notifications);
        verify(users, never()).delete(any());
    }

    @Test
    void accountWithValidationsIsNotDeleted() {
        existingUser();
        when(validations.existsByValidatorId(7L)).thenReturn(true);

        assertThrows(ConflictException.class, () -> service.deleteUser(7L));
        verifyNoInteractions(notifications);
        verify(users, never()).delete(any());
    }

    @Test
    void accountWithTrackingLinksIsNotDeleted() {
        existingUser();
        when(links.existsByRequesterIdOrReceiverId(7L, 7L)).thenReturn(true);

        assertThrows(ConflictException.class, () -> service.deleteUser(7L));
        verifyNoInteractions(notifications);
        verify(users, never()).delete(any());
    }

    @Test
    void missingAccountIsNotDeleted() {
        assertThrows(ResourceNotFoundException.class, () -> service.deleteUser(7L));
        verifyNoInteractions(goals, validations, links, notifications);
        verify(users, never()).delete(any());
    }
}
