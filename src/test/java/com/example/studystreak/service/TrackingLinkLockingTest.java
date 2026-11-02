package com.example.studystreak.service;

import com.example.studystreak.exceptions.ConflictException;
import com.example.studystreak.exceptions.ResourceNotFoundException;
import com.example.studystreak.model.TrackingLink;
import com.example.studystreak.model.User;
import com.example.studystreak.repository.TrackingLinkRepository;
import com.example.studystreak.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class TrackingLinkLockingTest {
    private final UserRepository users = mock(UserRepository.class);
    private final TrackingLinkRepository links = mock(TrackingLinkRepository.class);
    private final ApplicationEventPublisher events = mock(ApplicationEventPublisher.class);
    private final TrackingLinkService service = new TrackingLinkService(links, users, events);

    @BeforeEach
    void setUp() {
        User first = mock(User.class);
        User second = mock(User.class);
        when(first.getId()).thenReturn(3L);
        when(first.getUsername()).thenReturn("first");
        when(second.getId()).thenReturn(9L);
        when(second.getUsername()).thenReturn("second");
        when(users.findByIdForUpdate(3L)).thenReturn(Optional.of(first));
        when(users.findByIdForUpdate(9L)).thenReturn(Optional.of(second));
        when(links.findLinkBetweenUsers(any(), any())).thenReturn(Optional.empty());
        when(links.save(any(TrackingLink.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void locksAscendingIdsWhenRequesterIsFirst() {
        var response = service.createTrackingLink(3L, 9L);
        var order = inOrder(users, links);
        order.verify(users).findByIdForUpdate(3L);
        order.verify(users).findByIdForUpdate(9L);
        order.verify(links).findLinkBetweenUsers(3L, 9L);
        assertEquals(3L, response.getRequesterId());
        assertEquals(9L, response.getReceiverId());
    }

    @Test
    void reverseDirectionLocksInTheSameOrder() {
        var response = service.createTrackingLink(9L, 3L);
        var order = inOrder(users, links);
        order.verify(users).findByIdForUpdate(3L);
        order.verify(users).findByIdForUpdate(9L);
        order.verify(links).findLinkBetweenUsers(9L, 3L);
        assertEquals(9L, response.getRequesterId());
        assertEquals(3L, response.getReceiverId());
    }

    @Test
    void existingLinkIsRejectedBeforeSaving() {
        when(links.findLinkBetweenUsers(3L, 9L)).thenReturn(Optional.of(mock(TrackingLink.class)));
        assertThrows(ConflictException.class, () -> service.createTrackingLink(3L, 9L));
        verify(links, never()).save(any());
    }

    @Test
    void cannotCreateLinkWithSelf() {
        assertThrows(ConflictException.class, () -> service.createTrackingLink(3L, 3L));
        verify(users, never()).findByIdForUpdate(any());
    }

    @Test
    void missingUserPreventsSaving() {
        when(users.findByIdForUpdate(9L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.createTrackingLink(3L, 9L));
        verify(links, never()).save(any());
    }
}
