package com.example.studystreak.event;

import lombok.Getter;

@Getter
public class ValidationCreatedEvent {

    private final Long ownerId;
    private final Long validatorId;
    private final String goalTopic;

    public ValidationCreatedEvent(
            Long ownerId,
            Long validatorId,
            String goalTopic
    ) {
        this.ownerId = ownerId;
        this.validatorId = validatorId;
        this.goalTopic = goalTopic;
    }
}