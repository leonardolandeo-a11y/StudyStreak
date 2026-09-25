package com.example.studystreak.event;

import lombok.Getter;

@Getter
public class TrackingLinkBrokenEvent {

    private final Long requesterId;
    private final Long receiverId;
    private final Long brokenByUserId;

    public TrackingLinkBrokenEvent(Long requesterId, Long receiverId, Long brokenByUserId) {
        this.requesterId = requesterId;
        this.receiverId = receiverId;
        this.brokenByUserId = brokenByUserId;
    }
}