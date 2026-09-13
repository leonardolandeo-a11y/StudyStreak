package com.example.studystreak.repository;

import com.example.studystreak.model.Notification;
import com.example.studystreak.model.NotificationType;
import com.example.studystreak.model.TrackingLink;
import com.example.studystreak.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification,Long> {
    @Query("SELECT n FROM Notification n WHERE n.user.id=:userId ORDER BY n.createdAt DESC")
    List<Notification> findNotificationsInOrder(@Param("userId") Long userId);

    @Query("SELECT n FROM Notification n WHERE n.user.id = :userId AND n.read = false")
    List<Notification> findUnreadUserNotifications(@Param("userId") Long userId);

    @Query("SELECT n FROM Notification n WHERE n.user.id = :userId AND n.type = :type")
    List<Notification> findNotificationByType(@Param("userId") Long userId, @Param("type") NotificationType type);

}
