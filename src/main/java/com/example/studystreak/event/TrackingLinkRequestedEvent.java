package com.example.studystreak.event;

import lombok.Getter;

@Getter
public class TrackingLinkRequestedEvent {

    private final Long requesterId;
    private final Long receiverId;

    public TrackingLinkRequestedEvent(Long requesterId, Long receiverId) {
        this.requesterId = requesterId;
        this.receiverId = receiverId;
    }
}