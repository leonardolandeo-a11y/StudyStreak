package com.example.studystreak.dto.Room;

import jakarta.validation.constraints.NotNull;
public record StudyRoomTimerRequest(@NotNull Action action, Long expectedVersion) {
    public StudyRoomTimerRequest(Action action) { this(action, null); }
    public enum Action { START, PAUSE, RESET, FOCUS, BREAK }
}
