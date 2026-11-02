package com.example.studystreak.listener;

import com.example.studystreak.event.DailyRecordCreatedEvent;
import com.example.studystreak.model.NotificationType;
import com.example.studystreak.model.TrackingStatus;
import com.example.studystreak.repository.DailyRecordRepository;
import com.example.studystreak.repository.TrackingLinkRepository;
import com.example.studystreak.service.NotificationService;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.lang.reflect.Method;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class DailyRecordCreatedEventListenerTest {
    private static final DailyRecordCreatedEvent EVENT =
            new DailyRecordCreatedEvent(11L, "SRHouse", "Calculus", 7L, 23L);

    @Test
    void notifiesAcceptedPartnersOnceInEitherDirection() {
        TrackingLinkRepository links = mock(TrackingLinkRepository.class);
        DailyRecordRepository records = mock(DailyRecordRepository.class);
        NotificationService notifications = mock(NotificationService.class);
        when(records.existsById(23L)).thenReturn(true);
        when(links.findPartnerIdsByUserIdAndStatus(11L, TrackingStatus.ACCEPTED))
                .thenReturn(List.of(22L, 33L, 22L, 11L));
        new DailyRecordCreatedEventListener(links, records, notifications).onDailyRecordCreated(EVENT);
        verify(notifications).createNotification(22L,
                "SRHouse added a new daily record for \"Calculus\".",
                NotificationType.DAILY_RECORD_CREATED, 7L, 23L, null);
        verify(notifications).createNotification(33L,
                "SRHouse added a new daily record for \"Calculus\".",
                NotificationType.DAILY_RECORD_CREATED, 7L, 23L, null);
        verifyNoMoreInteractions(notifications);
    }

    @Test
    void recordDeletedBeforeListenerRunsSendsNothing() {
        TrackingLinkRepository links = mock(TrackingLinkRepository.class);
        DailyRecordRepository records = mock(DailyRecordRepository.class);
        NotificationService notifications = mock(NotificationService.class);
        new DailyRecordCreatedEventListener(links, records, notifications).onDailyRecordCreated(EVENT);
        verifyNoInteractions(links, notifications);
    }

    @Test
    void noAcceptedPartnersMeansNoNotifications() {
        TrackingLinkRepository links = mock(TrackingLinkRepository.class);
        DailyRecordRepository records = mock(DailyRecordRepository.class);
        NotificationService notifications = mock(NotificationService.class);
        when(records.existsById(23L)).thenReturn(true);
        when(links.findPartnerIdsByUserIdAndStatus(11L, TrackingStatus.ACCEPTED))
                .thenReturn(List.of());
        new DailyRecordCreatedEventListener(links, records, notifications).onDailyRecordCreated(EVENT);
        verifyNoInteractions(notifications);
    }

    @Test
    void listenerExecutesOnlyAfterCommittedTransaction() throws Exception {
        Method listener = DailyRecordCreatedEventListener.class
                .getMethod("onDailyRecordCreated", DailyRecordCreatedEvent.class);
        TransactionalEventListener annotation = listener.getAnnotation(TransactionalEventListener.class);
        assertNotNull(annotation);
        assertEquals(TransactionPhase.AFTER_COMMIT, annotation.phase());
    }
}
