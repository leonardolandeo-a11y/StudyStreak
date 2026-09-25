package com.example.studystreak.event;

import com.example.studystreak.model.TrackingStatus;
import lombok.Getter;

@Getter
public class TrackingLinkRespondedEvent {

    private final Long requesterId;
    private final Long receiverId;
    private final TrackingStatus status;

    public TrackingLinkRespondedEvent(Long requesterId, Long receiverId, TrackingStatus status) {
        this.requesterId = requesterId;
        this.receiverId = receiverId;
        this.status = status;
    }
}