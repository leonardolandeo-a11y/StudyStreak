package com.example.studystreak.dto.Focus;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record FocusSessionRequestDTO(
        @NotNull UUID sessionId,
        @NotNull @Min(5) @Max(120) Integer durationMinutes
) {}
