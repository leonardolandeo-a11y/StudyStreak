package com.example.studystreak.dto.Focus;

import java.time.LocalDate;
import java.util.List;

/** Aggregates confirmed, goal-linked Pomodoros, not unsynced client timers. */
public record FocusStatisticsDTO(
        int days,
        long totalMinutes,
        long completedSessions,
        long periodMinutes,
        long periodSessions,
        long bestDayMinutes,
        List<DailyFocus> daily,
        List<GoalFocus> byGoal
) {
    public record DailyFocus(LocalDate date, long minutes, long sessions) {}
    public record GoalFocus(Long goalId, String topic, long minutes, long sessions) {}
}
