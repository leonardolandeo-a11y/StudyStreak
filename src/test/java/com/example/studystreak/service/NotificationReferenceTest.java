package com.example.studystreak.service;

import com.example.studystreak.dto.Notification.NotificationDTO;
import com.example.studystreak.model.Notification;
import com.example.studystreak.model.NotificationType;
import com.example.studystreak.model.User;
import com.example.studystreak.repository.NotificationRepository;
import com.example.studystreak.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.modelmapper.ModelMapper;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class NotificationReferenceTest {
    @Test
    void newValidationNotificationIncludesExactRecordReference() {
        NotificationRepository notifications = mock(NotificationRepository.class);
        UserRepository users = mock(UserRepository.class);
        when(users.findById(11L)).thenReturn(Optional.of(mock(User.class)));
        when(notifications.save(any(Notification.class))).thenAnswer(call -> {
            Notification notification = call.getArgument(0);
            notification.setId(100L);
            return notification;
        });

        NotificationService service = new NotificationService(notifications, new ModelMapper(), users);
        NotificationDTO result = service.createNotification(
                11L, "Progress validated", NotificationType.VALIDATION_RECEIVED,
                7L, 42L, null
        );

        assertEquals(7L, result.getRelatedGoalId());
        assertEquals(42L, result.getRelatedDailyRecordId());
        assertNull(result.getRelatedTrackingLinkId());
    }

    @Test
    void olderNotificationCreationStillWorksWithoutReferences() {
        NotificationRepository notifications = mock(NotificationRepository.class);
        UserRepository users = mock(UserRepository.class);
        when(users.findById(11L)).thenReturn(Optional.of(mock(User.class)));
        when(notifications.save(any(Notification.class))).thenAnswer(call -> call.getArgument(0));

        NotificationService service = new NotificationService(notifications, new ModelMapper(), users);
        NotificationDTO result = service.createNotification(
                11L, "Weekly summary", NotificationType.WEEKLY_SUMMARY
        );

        assertNull(result.getRelatedGoalId());
        assertNull(result.getRelatedDailyRecordId());
        assertNull(result.getRelatedTrackingLinkId());
    }
}
