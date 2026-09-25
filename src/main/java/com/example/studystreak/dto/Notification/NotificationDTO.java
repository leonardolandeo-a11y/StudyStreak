package com.example.studystreak.dto.Notification;

import com.example.studystreak.model.NotificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class NotificationDTO {

    private Long id;

    @NotBlank(message = "Message is required")
    @Size(max = 500, message = "Message cannot exceed 500 characters")
    private String message;

    private Boolean read;

    private LocalDateTime createdAt;

    @NotNull(message = "Notification type is required")
    private NotificationType type;

    protected NotificationDTO(){}
}