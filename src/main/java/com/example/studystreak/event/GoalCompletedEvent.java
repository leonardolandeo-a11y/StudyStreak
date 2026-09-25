package com.example.studystreak.event;

import lombok.Getter;

@Getter
public class GoalCompletedEvent {

    private final Long goalId;
    private final Long userId;

    public GoalCompletedEvent(Long goalId, Long userId) {
        this.goalId = goalId;
        this.userId = userId;
    }
}