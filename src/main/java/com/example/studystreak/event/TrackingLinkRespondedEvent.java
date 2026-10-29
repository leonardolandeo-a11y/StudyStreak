package com.example.studystreak.event;

import com.example.studystreak.model.TrackingStatus;
import lombok.Getter;

@Getter
public class TrackingLinkRespondedEvent {

    private final Long requesterId;
    private final Long receiverId;
    private final Long trackingLinkId;
    private final TrackingStatus status;

    public TrackingLinkRespondedEvent(Long requesterId, Long receiverId, TrackingStatus status, Long trackingLinkId) {
        this.requesterId = requesterId;
        this.receiverId = receiverId;
        this.trackingLinkId = trackingLinkId;
        this.status = status;
    }
}