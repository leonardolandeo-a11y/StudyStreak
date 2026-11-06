package com.example.studystreak.dto.Room;

import jakarta.validation.constraints.NotBlank;
public record StudyRoomJoinRequest(@NotBlank @jakarta.validation.constraints.Size(max = 32) String code) {}
