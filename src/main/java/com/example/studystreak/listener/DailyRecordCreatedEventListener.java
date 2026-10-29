package com.example.studystreak.listener;

import com.example.studystreak.event.DailyRecordCreatedEvent;
import com.example.studystreak.model.NotificationType;
import com.example.studystreak.model.TrackingStatus;
import com.example.studystreak.repository.DailyRecordRepository;
import com.example.studystreak.repository.TrackingLinkRepository;
import com.example.studystreak.service.NotificationService;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.HashSet;
import java.util.Set;

@Component
public class DailyRecordCreatedEventListener {
    private final TrackingLinkRepository trackingLinkRepository;
    private final DailyRecordRepository dailyRecordRepository;
    private final NotificationService notificationService;

    public DailyRecordCreatedEventListener(
            TrackingLinkRepository trackingLinkRepository,
            DailyRecordRepository dailyRecordRepository,
            NotificationService notificationService) {
        this.trackingLinkRepository = trackingLinkRepository;
        this.dailyRecordRepository = dailyRecordRepository;
        this.notificationService = notificationService;
    }

    @Async("taskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onDailyRecordCreated(DailyRecordCreatedEvent event) {
        // The record may have been deleted before the asynchronous listener runs.
        if (!dailyRecordRepository.existsById(event.dailyRecordId())) {
            return;
        }

        Set<Long> notifiedPartners = new HashSet<>();
        for (Long partnerId : trackingLinkRepository.findPartnerIdsByUserIdAndStatus(
                event.ownerId(), TrackingStatus.ACCEPTED)) {
            if (partnerId == null || partnerId.equals(event.ownerId()) || !notifiedPartners.add(partnerId)) {
                continue;
            }

            // Notification.message is a VARCHAR(255) by default.
            String message = event.ownerUsername() + " added a new daily record for \"" + event.goalTopic() + "\".";
            if (message.length() > 255) {
                message = message.substring(0, 252) + "...";
            }
            notificationService.createNotification(
                    partnerId, message, NotificationType.DAILY_RECORD_CREATED,
                    event.goalId(), event.dailyRecordId(), null);
        }
    }
}
