package com.example.studystreak.service;

import com.example.studystreak.dto.Notification.NotificationDTO;
import com.example.studystreak.exceptions.ForbiddenException;
import com.example.studystreak.exceptions.ResourceNotFoundException;
import com.example.studystreak.model.*;
import com.example.studystreak.repository.NotificationRepository;
import com.example.studystreak.repository.UserRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final ModelMapper modelMapper;

    @Autowired
    public NotificationService(NotificationRepository notificationRepository, ModelMapper modelMapper, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.modelMapper = modelMapper;
    }

    public NotificationDTO createNotification(Long userId, String message, NotificationType type) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Notification notification = new Notification(message, false, LocalDateTime.now(),
                type, user);


        Notification savednotification = notificationRepository.save(notification);

        return toResponse(savednotification);
    }

    public Page<NotificationDTO> getNotificationByUserId(Long userId, Pageable pageable) {

        return notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::toResponse);
    }


    public Page<NotificationDTO> getUnreadNotificationsByUserId(Long userId, Pageable pageable) {

        return notificationRepository
                .findByUserIdAndReadFalseOrderByCreatedAtDesc(userId, pageable)
                .map(this::toResponse);
    }

    public Page<NotificationDTO> getNotificationsByTypeAndUserId(
            Long userId, NotificationType type, Pageable pageable) {

        return notificationRepository
                .findByUserIdAndTypeOrderByCreatedAtDesc(userId, type, pageable)
                .map(this::toResponse);
    }


    public NotificationDTO markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                        .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: "
                                                + notificationId));

        if (!notification.getUser().getId().equals(userId)) {
            throw new ForbiddenException("User with id: " + userId + " cannot access notification with id: "
                            + notificationId
            );
        }

        notification.setRead(true);
        Notification savedNotification = notificationRepository.save(notification);

        return toResponse(savedNotification);
    }

    public void deleteNotification(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                        .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: "
                                                + notificationId
                                )
                        );

        if (!notification.getUser().getId().equals(userId)) {
            throw new ForbiddenException("User with id: " + userId + " cannot access notification with id: "
                            + notificationId
            );
        }

        notificationRepository.delete(notification);
    }

    private NotificationDTO toResponse(
            Notification notification
    ) {
        return modelMapper.map(
                notification,
                NotificationDTO.class
        );
    }
    @Transactional
    public NotificationDTO createGoalCompletedNotification(Long userId, Long goalId) {

        String message = "¡Felicidades! Has completado la meta con id: " + goalId;

        return createNotification(userId, message, NotificationType.GOAL_COMPLETED);
    }
}

