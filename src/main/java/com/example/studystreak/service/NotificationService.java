package com.example.studystreak.service;

import com.example.studystreak.dto.Notification.NotificationDTO;
import com.example.studystreak.exceptions.ForbiddenException;
import com.example.studystreak.exceptions.ResourceNotFoundException;
import com.example.studystreak.model.*;
import com.example.studystreak.repository.NotificationRepository;
import com.example.studystreak.repository.UserRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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

    public NotificationDTO createdNotification(Long userId, NotificationDTO notificationDTO) {
        Notification notification = modelMapper.map(notificationDTO, Notification.class);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        notification.setUser(user);
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());

        //por motivos de seguridad seteeamos read y createdat
        Notification savednotification = notificationRepository.save(notification);

        return modelMapper.map(savednotification, NotificationDTO.class);
    }

    public List<NotificationDTO> getNotificationByUserId(Long UserId) {
        List<Notification> notifications = notificationRepository.findNotificationsInOrder(UserId);
        List<NotificationDTO> notificationDTOS = new ArrayList<>();

        for (Notification notification : notifications) {
            notificationDTOS.add(modelMapper.map(notification, NotificationDTO.class));
        }

        return notificationDTOS;
    }

    public List<NotificationDTO> getUnreadNotificationsByUserId(Long UserId) {
        List<Notification> notifications = notificationRepository.findUnreadUserNotifications(UserId);
        List<NotificationDTO> notificationDTOS = new ArrayList<>();

        for (Notification notification : notifications) {
            notificationDTOS.add(modelMapper.map(notification, NotificationDTO.class));
        }

        return notificationDTOS;
    }

    public List<NotificationDTO> getNotificationsByTypeAndUserId(Long UserId, NotificationType type) {
        List<Notification> notifications = notificationRepository.findNotificationByType(UserId, type);
        List<NotificationDTO> notificationDTOS = new ArrayList<>();

        for (Notification notification : notifications) {
            notificationDTOS.add(modelMapper.map(notification, NotificationDTO.class));
        }

        return notificationDTOS;
    }

    public NotificationDTO markAsRead(Long notificationId, Long UserId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + notificationId));

        if (!notification.getUser().getId().equals(UserId)) {
            throw new ForbiddenException("User with id: " + UserId + " cannot access notification with id: " + notificationId);
        }

        notification.setRead(true);

        Notification Readnotification = notificationRepository.save(notification);

        return modelMapper.map(Readnotification, NotificationDTO.class);
    }

    public void deleteNotification(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + notificationId));

        if (!notification.getUser().getId().equals(userId)) {
            throw new ForbiddenException("User with id: " + userId + " cannot access notification with id: " + notificationId);
        }

        notificationRepository.delete(notification);
    }
}