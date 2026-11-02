package com.example.studystreak.event;

import lombok.Getter;

@Getter
public class TrackingLinkRequestedEvent {

    private final Long requesterId;
    private final Long receiverId;
    private final Long trackingLinkId;

    public TrackingLinkRequestedEvent(Long requesterId, Long receiverId, Long trackingLinkId) {
        this.requesterId = requesterId;
        this.receiverId = receiverId;
        this.trackingLinkId = trackingLinkId;
    }
}