package com.example.studystreak.listener;

import com.example.studystreak.event.ValidationCreatedEvent;
import com.example.studystreak.exceptions.ResourceNotFoundException;
import com.example.studystreak.model.NotificationType;
import com.example.studystreak.model.User;
import com.example.studystreak.repository.UserRepository;
import com.example.studystreak.service.NotificationService;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;


@Component
public class ValidationEventListener {

    private final NotificationService notificationService;
    private final UserRepository userRepository;


    public ValidationEventListener(
            NotificationService notificationService,
            UserRepository userRepository
    ) {
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }


    @Async("taskExecutor")
    @TransactionalEventListener(
            phase = TransactionPhase.AFTER_COMMIT
    )
    public void handleValidationCreated(
            ValidationCreatedEvent event
    ) {

        User validator =
                userRepository
                        .findById(event.getValidatorId())
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Validator not found with id: "
                                                + event.getValidatorId()
                                )
                        );


        String message =
                validator.getUsername()
                        + " validated your progress for \""
                        + event.getGoalTopic()
                        + "\".";


        notificationService.createNotification(
                event.getOwnerId(),
                message,
                NotificationType.VALIDATION_RECEIVED
        );
    }
}