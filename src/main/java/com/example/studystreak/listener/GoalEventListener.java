package com.example.studystreak.listener;

import com.example.studystreak.event.GoalCompletedEvent;
import com.example.studystreak.service.NotificationService;
import com.example.studystreak.service.StreakService;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class GoalEventListener {

    private final StreakService streakService;
    private final NotificationService notificationService;

    public GoalEventListener(
            StreakService streakService,
            NotificationService notificationService
    ) {
        this.streakService = streakService;
        this.notificationService = notificationService;
    }

    @Async("taskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleGoalCompleted(GoalCompletedEvent event) {

        streakService.recalculateStreak(event.getUserId());

        notificationService.createGoalCompletedNotification(event.getUserId(), event.getGoalId());
    }
}