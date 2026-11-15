package com.example.studystreak.model;

import com.fasterxml.jackson.annotation.JsonCreator;

/** Independent of progress, planned time and completion. */
public enum GoalDifficulty {
    TRIVIAL, EASY, INTERMEDIATE, HARD;

    @JsonCreator
    public static GoalDifficulty fromJson(String value) {
        return value == null ? null : GoalDifficulty.valueOf(value);
    }
}
