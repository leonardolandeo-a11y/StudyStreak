package com.example.studystreak.dto.Room;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
public record StudyRoomHostRequest(@NotNull @Positive Long userId) {}
