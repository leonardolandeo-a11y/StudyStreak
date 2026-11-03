package com.example.studystreak.dto.Room;

import jakarta.validation.constraints.NotBlank;
public record StudyRoomJoinRequest(@NotBlank String code) {}
