package com.example.studystreak.service;

import com.example.studystreak.model.TrackingLink;
import com.example.studystreak.model.TrackingStatus;
import com.example.studystreak.model.User;
import com.example.studystreak.repository.TrackingLinkRepository;
import com.example.studystreak.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class TrackingLinkIdentityTest {
    @Test
    void returnsUsernamesWithoutChangingTrackingIds() {
        TrackingLinkRepository repository = mock(TrackingLinkRepository.class);
        User requester = mock(User.class);
        User receiver = mock(User.class);
        TrackingLink link = mock(TrackingLink.class);
        var pageable = PageRequest.of(0, 10);

        when(requester.getId()).thenReturn(1L);
        when(requester.getUsername()).thenReturn("sender");
        when(receiver.getId()).thenReturn(2L);
        when(receiver.getUsername()).thenReturn("receiver");
        when(link.getId()).thenReturn(9L);
        when(link.getRequester()).thenReturn(requester);
        when(link.getReceiver()).thenReturn(receiver);
        when(link.getStatus()).thenReturn(TrackingStatus.ACCEPTED);
        when(repository.findLinksByUserId(1L, pageable)).thenReturn(new PageImpl<>(List.of(link)));

        TrackingLinkService service = new TrackingLinkService(
                repository,
                mock(UserRepository.class),
                mock(ApplicationEventPublisher.class)
        );
        var response = service.getTrackingLinksByUserId(1L, pageable).getContent().getFirst();

        assertEquals(1L, response.getRequesterId());
        assertEquals(2L, response.getReceiverId());
        assertEquals("sender", response.getRequesterUsername());
        assertEquals("receiver", response.getReceiverUsername());
    }
}
