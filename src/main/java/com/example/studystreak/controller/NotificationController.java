package com.example.studystreak.controller;

import com.example.studystreak.dto.Notification.NotificationDTO;
import com.example.studystreak.model.NotificationType;
import com.example.studystreak.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/users/{userId}/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {

        this.notificationService = notificationService;
    }

    private void validateUserAccess(Long pathUserId, Long headerUserId) {

        if (!pathUserId.equals(headerUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado");
        }
    }

    @GetMapping
    public ResponseEntity<List<NotificationDTO>>
    getUserNotifications(@PathVariable Long userId, @RequestHeader("X-User-Id") Long currentUserId) {
        validateUserAccess(userId, currentUserId);

        return ResponseEntity.ok(
                notificationService.getNotificationByUserId(userId)
        );
    }

    @GetMapping("/unread")
    public ResponseEntity<List<NotificationDTO>>
    getUnreadNotifications(@PathVariable Long userId, @RequestHeader("X-User-Id") Long currentUserId) {

        validateUserAccess(userId, currentUserId);

        return ResponseEntity.ok(
                notificationService.getUnreadNotificationsByUserId(userId)
        );
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<NotificationDTO>>
    getNotificationsByType(@PathVariable Long userId, @PathVariable NotificationType type,
            @RequestHeader("X-User-Id") Long currentUserId) {

        validateUserAccess(userId, currentUserId);

        return ResponseEntity.ok(notificationService.getNotificationsByTypeAndUserId(userId, type)
        );
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<NotificationDTO>
    markNotificationAsRead(@PathVariable Long userId, @PathVariable Long notificationId,
            @RequestHeader("X-User-Id") Long currentUserId) {

        validateUserAccess(userId, currentUserId);

        return ResponseEntity.ok(notificationService.markAsRead(notificationId, userId)
        );
    }

    @DeleteMapping("/{notificationId}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long userId, @PathVariable Long notificationId,
            @RequestHeader("X-User-Id") Long currentUserId
    ) {
        validateUserAccess(userId, currentUserId);

        notificationService.deleteNotification(notificationId, userId);
        return ResponseEntity.noContent().build();
    }
}