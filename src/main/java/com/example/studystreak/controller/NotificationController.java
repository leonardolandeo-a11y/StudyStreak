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
    //inyeccion
    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }
    /*
    funcion auxiliar para validar usuarios (seria bueno modificar laa estructura de los endpoints para
    no depender de estas cosas)
     */
    private void validateUserAccess(Long pathUserId, Long headerUserId) {
        if (!pathUserId.equals(headerUserId)) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado");
        //implementar despues
    }

    //get
    @GetMapping
    public ResponseEntity<List<NotificationDTO>> getUserNotifications(@PathVariable Long userId ,
                                                                      @RequestHeader("X-User-Id") Long currentUserId) {
        validateUserAccess(userId, currentUserId);
        List<NotificationDTO> userNotifications = notificationService.getNotificationByUserId(userId);
        return ResponseEntity.ok(userNotifications);
    }
    @GetMapping("/unread")
    public ResponseEntity<List<NotificationDTO>> getUnReadNotifications(@PathVariable Long userId ,
                                                                        @RequestHeader("X-User-Id") Long currentUserId) {
        validateUserAccess(userId, currentUserId);
        List<NotificationDTO> userNotifications = notificationService.getUnreadNotificationsByUserId(userId);
        return ResponseEntity.ok(userNotifications);
    }
    @GetMapping("/type/{type}")
    public ResponseEntity<List<NotificationDTO>> getTypeNotifications(@PathVariable NotificationType type, @PathVariable Long userId ,
                                                                      @RequestHeader("X-User-Id") Long currentUserId) {
        validateUserAccess(userId,currentUserId);
        List<NotificationDTO> userNotifications = notificationService.getNotificationsByTypeAndUserId(userId,type);
        return ResponseEntity.ok(userNotifications);
    }
    //post
    @PostMapping
    public ResponseEntity<NotificationDTO> createNotification(@RequestBody NotificationDTO notificationDTO,
                                                              @PathVariable Long userId,
                                                              @RequestHeader("X-User-Id") Long currentUserId) {
        validateUserAccess(userId, currentUserId);
        NotificationDTO SavedNotification = notificationService.createdNotification(userId,notificationDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(SavedNotification);
    }
    //patch
    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<NotificationDTO>  markNotificationAsRead(@PathVariable Long notificationId,@PathVariable Long userId ,
                                                                   @RequestHeader("X-User-Id") Long currentUserId) {
        validateUserAccess(userId,currentUserId);
        NotificationDTO ReadNotification = notificationService.markAsRead(notificationId, userId);
        return ResponseEntity.ok(ReadNotification);
    }
    @DeleteMapping("/{notificationId}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long notificationId, @PathVariable Long userId,
                                                              @RequestHeader("X-User-Id") Long currentUserId) {
        validateUserAccess(userId,currentUserId);
        notificationService.deleteNotification(notificationId, userId); //despues lo corrijo
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
