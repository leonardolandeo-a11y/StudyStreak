package com.example.studystreak.dto.Focus;

import java.time.Instant;
import java.util.UUID;

public record FocusSessionResponseDTO(
        UUID sessionId, Long goalId, Integer durationMinutes, Instant completedAt
) {}
