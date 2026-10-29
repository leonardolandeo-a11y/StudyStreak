package com.example.studystreak.event;

public record DailyRecordCreatedEvent(
        Long ownerId,
        String ownerUsername,
        String goalTopic,
        Long goalId,
        Long dailyRecordId
) {}
