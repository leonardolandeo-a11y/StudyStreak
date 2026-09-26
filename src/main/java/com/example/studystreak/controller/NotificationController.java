package com.example.studystreak.controller;

import com.example.studystreak.dto.Notification.NotificationDTO;
import com.example.studystreak.exceptions.ForbiddenException;
import com.example.studystreak.model.NotificationType;
import com.example.studystreak.service.CurrentUserService;
import com.example.studystreak.service.NotificationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users/{userId}/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final CurrentUserService currentUserService;

    public NotificationController(
            NotificationService notificationService,
            CurrentUserService currentUserService
    ) {
        this.notificationService = notificationService;
        this.currentUserService = currentUserService;
    }

    private void validateUserAccess(Long pathUserId) {
        Long currentUserId = currentUserService.getCurrentUserId();

        if (!pathUserId.equals(currentUserId)) {
            throw new ForbiddenException(
                    "You cannot access notifications of another user"
            );
        }
    }

    @GetMapping
    public ResponseEntity<Page<NotificationDTO>> getUserNotifications(
            @PathVariable Long userId,
            Pageable pageable
    ) {
        validateUserAccess(userId);

        return ResponseEntity.ok(
                notificationService.getNotificationByUserId(userId, pageable)
        );
    }

    @GetMapping("/unread")
    public ResponseEntity<Page<NotificationDTO>> getUnreadNotifications(
            @PathVariable Long userId,
            Pageable pageable
    ) {
        validateUserAccess(userId);

        return ResponseEntity.ok(
                notificationService.getUnreadNotificationsByUserId(userId, pageable)
        );
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<Page<NotificationDTO>> getNotificationsByType(
            @PathVariable Long userId,
            @PathVariable NotificationType type,
            Pageable pageable
    ) {
        validateUserAccess(userId);

        return ResponseEntity.ok(
                notificationService.getNotificationsByTypeAndUserId(
                        userId,
                        type,
                        pageable
                )
        );
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<NotificationDTO> markNotificationAsRead(
            @PathVariable Long userId,
            @PathVariable Long notificationId
    ) {
        validateUserAccess(userId);

        return ResponseEntity.ok(
                notificationService.markAsRead(notificationId, userId)
        );
    }

    @DeleteMapping("/{notificationId}")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable Long userId,
            @PathVariable Long notificationId
    ) {
        validateUserAccess(userId);

        notificationService.deleteNotification(notificationId, userId);

        return ResponseEntity.noContent().build();
    }
}
