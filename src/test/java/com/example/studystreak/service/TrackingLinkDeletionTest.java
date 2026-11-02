package com.example.studystreak.service;

import com.example.studystreak.event.TrackingLinkBrokenEvent;
import com.example.studystreak.exceptions.ForbiddenException;
import com.example.studystreak.exceptions.ResourceNotFoundException;
import com.example.studystreak.model.TrackingLink;
import com.example.studystreak.model.User;
import com.example.studystreak.repository.NotificationRepository;
import com.example.studystreak.repository.TrackingLinkRepository;
import com.example.studystreak.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.context.ApplicationEventPublisher;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class TrackingLinkDeletionTest {
    private final TrackingLinkRepository links = mock(TrackingLinkRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final NotificationRepository notifications = mock(NotificationRepository.class);
    private final ApplicationEventPublisher events = mock(ApplicationEventPublisher.class);
    private final TrackingLinkService service = new TrackingLinkService(links, users, events, notifications);
    private final TrackingLink link = mock(TrackingLink.class);

    @BeforeEach
    void setUp() {
        User requester = mock(User.class);
        User receiver = mock(User.class);
        when(requester.getId()).thenReturn(10L);
        when(receiver.getId()).thenReturn(20L);
        when(link.getRequester()).thenReturn(requester);
        when(link.getReceiver()).thenReturn(receiver);
        when(links.findById(50L)).thenReturn(Optional.of(link));
    }

    @Test
    void requesterDeletionClearsNotificationReferencesBeforeDeletingLink() {
        service.deleteTrackingLink(50L, 10L);

        var order = inOrder(notifications, links, events);
        order.verify(notifications).clearDeletedTrackingLinkReferences(50L);
        order.verify(links).delete(link);
        order.verify(events).publishEvent(any(TrackingLinkBrokenEvent.class));

        ArgumentCaptor<TrackingLinkBrokenEvent> event = ArgumentCaptor.forClass(TrackingLinkBrokenEvent.class);
        verify(events).publishEvent(event.capture());
        assertEquals(10L, event.getValue().getRequesterId());
        assertEquals(20L, event.getValue().getReceiverId());
        assertEquals(10L, event.getValue().getBrokenByUserId());
    }

    @Test
    void receiverCanDeleteTheLink() {
        service.deleteTrackingLink(50L, 20L);
        verify(notifications).clearDeletedTrackingLinkReferences(50L);
        verify(links).delete(link);
    }

    @Test
    void unrelatedUserCannotDeleteTheLinkOrChangeNotifications() {
        assertThrows(ForbiddenException.class, () -> service.deleteTrackingLink(50L, 30L));
        verifyNoInteractions(notifications);
        verify(links, never()).delete(any());
        verifyNoInteractions(events);
    }

    @Test
    void missingLinkDoesNotChangeNotifications() {
        when(links.findById(51L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.deleteTrackingLink(51L, 10L));
        verifyNoInteractions(notifications);
        verify(links, never()).delete(any());
    }
}
