package com.example.studystreak.listener;

import com.example.studystreak.event.TrackingLinkBrokenEvent;
import com.example.studystreak.event.TrackingLinkRequestedEvent;
import com.example.studystreak.event.TrackingLinkRespondedEvent;
import com.example.studystreak.exceptions.ResourceNotFoundException;
import com.example.studystreak.model.NotificationType;
import com.example.studystreak.model.TrackingStatus;
import com.example.studystreak.model.User;
import com.example.studystreak.repository.UserRepository;
import com.example.studystreak.service.NotificationService;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class TrackingLinkEventListener {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public TrackingLinkEventListener(NotificationService notificationService, UserRepository userRepository) {
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }


    /*
     * Cuando A envia una solicitud a B:
     *
     * A = requester
     * B = receiver
     *
     * Se notifica a B.
     */
    @Async("taskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleTrackingRequested(TrackingLinkRequestedEvent event) {

        User requester = userRepository
                .findById(event.getRequesterId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Requester not found with id: " + event.getRequesterId()));

        String message = requester.getUsername() + " sent you a tracking request";

        notificationService.createNotification(event.getReceiverId(), message, NotificationType.TRACKING_REQUESTED);
    }


    /*
     * Cuando B responde:
     *
     * ACCEPTED o REJECTED.
     *
     * Se notifica al requester A.
     */
    @Async("taskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleTrackingResponded(TrackingLinkRespondedEvent event) {

        User receiver = userRepository
                .findById(event.getReceiverId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Receiver not found with id: " + event.getReceiverId())
                );

        if (event.getStatus() == TrackingStatus.ACCEPTED) {

            String message = receiver.getUsername() + " accepted your tracking request";

            notificationService.createNotification(event.getRequesterId(), message, NotificationType.TRACKING_ACCEPTED);

        } else if (
                event.getStatus() == TrackingStatus.REJECTED
        ) {

            String message = receiver.getUsername() + " rejected your tracking request";

            notificationService.createNotification(event.getRequesterId(), message, NotificationType.TRACKING_REJECTED);
        }
    }


    /*
     * Cuando uno de los dos usuarios rompe
     * el TrackingLink.
     *
     * Se notifica al OTRO usuario.
     */
    @Async("taskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleTrackingBroken(TrackingLinkBrokenEvent event) {

        Long notifiedUserId;

        if (event.getBrokenByUserId().equals(event.getRequesterId())) {

            notifiedUserId = event.getReceiverId();

        } else {

            notifiedUserId = event.getRequesterId();
        }

        User userWhoBrokeLink = userRepository.findById(event.getBrokenByUserId()).orElseThrow(() ->
                        new ResourceNotFoundException("User not found with id: " + event.getBrokenByUserId()));

        String message = userWhoBrokeLink.getUsername() + " ended the tracking connection";

        notificationService.createNotification(notifiedUserId, message, NotificationType.TRACKING_BROKEN);
    }
}