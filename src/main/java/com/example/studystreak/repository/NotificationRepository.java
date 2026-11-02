package com.example.studystreak.repository;

import org.springframework.data.jpa.repository.Modifying;

import com.example.studystreak.model.Notification;
import com.example.studystreak.model.NotificationType;
import com.example.studystreak.model.TrackingLink;
import com.example.studystreak.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification,Long> {

    Page<Notification> findByUserIdOrderByCreatedAtDesc(
            Long userId, Pageable pageable);

    Page<Notification> findByUserIdAndReadFalseOrderByCreatedAtDesc(
            Long userId, Pageable pageable);

    Page<Notification> findByUserIdAndTypeOrderByCreatedAtDesc(
            Long userId, NotificationType type, Pageable pageable);

    // Preserve notification messages but remove navigation to a deleted record.
    @Modifying
    @Query("update Notification n set n.relatedDailyRecordId = null " +
            "where n.relatedDailyRecordId = :dailyRecordId")
    int clearDeletedDailyRecordReferences(@Param("dailyRecordId") Long dailyRecordId);

    // Keep notification history, but remove links to deleted resources.
    @Modifying
    @Query("update Notification n set n.relatedGoalId = null, n.relatedDailyRecordId = null " +
            "where n.relatedGoalId = :goalId or n.relatedDailyRecordId in " +
            "(select d.id from DailyRecord d where d.goal.id = :goalId)")
    int clearDeletedGoalReferences(@Param("goalId") Long goalId);

    // Keep notifications but remove links to tracking connections that no longer exist.
    @Modifying
    @Query("update Notification n set n.relatedTrackingLinkId = null " +
            "where n.relatedTrackingLinkId = :trackingLinkId")
    int clearDeletedTrackingLinkReferences(@Param("trackingLinkId") Long trackingLinkId);
}
