package com.example.studystreak.dto.Room;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record StudyRoomRequest(
        @NotBlank @Size(min = 3, max = 60) String name
) {}
