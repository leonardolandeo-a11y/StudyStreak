package com.example.studystreak.dto.Room;

import jakarta.validation.constraints.NotNull;
public record StudyRoomTimerRequest(@NotNull Action action) {
    public enum Action { START, PAUSE, RESET, FOCUS, BREAK }
}
