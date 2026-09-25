package com.example.studystreak.dto.Streak;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class StreakDTO {

    private Long id; //id se queda en el dto

    @NotNull(message = "Current streak is required")
    @PositiveOrZero(message = "Current streak cannot be negative")
    private Integer currentStreak;

    @NotNull(message = "Best streak is required")
    @PositiveOrZero(message = "Best streak cannot be negative")
    private Integer bestStreak;

    @NotNull(message = "Last update date is required")
    private LocalDate lastUpdateDate;

    protected StreakDTO(){}
}