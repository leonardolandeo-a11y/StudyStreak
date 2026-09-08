package com.example.studystreak.dto.Streak;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class StreakDTO {
    private Integer currentStreak;
    private Integer bestStreak;
    private LocalDate lastUpdateDate;
    protected StreakDTO(){}
}
