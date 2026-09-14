package com.example.studystreak.dto.Notification;

import com.example.studystreak.model.NotificationType;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
@Getter
@Setter
public class NotificationDTO {
    private String message;
    private Boolean read;
    private LocalDateTime createdAt;
    private NotificationType type;
    protected NotificationDTO(){}
}
