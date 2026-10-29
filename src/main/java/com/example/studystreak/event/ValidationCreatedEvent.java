package com.example.studystreak.event;

import lombok.Getter;

@Getter
public class ValidationCreatedEvent {

    private final Long ownerId;
    private final Long validatorId;
    private final String goalTopic;
    private final Long goalId;
    private final Long dailyRecordId;

    public ValidationCreatedEvent(
            Long ownerId,
            Long validatorId,
            String goalTopic,
            Long goalId,
            Long dailyRecordId
    ) {
        this.ownerId = ownerId;
        this.validatorId = validatorId;
        this.goalTopic = goalTopic;
        this.goalId = goalId;
        this.dailyRecordId = dailyRecordId;
    }
}