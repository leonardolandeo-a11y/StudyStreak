package com.example.studystreak.dto.Profile;

import java.math.BigDecimal;

/** Streaks retain Study Ledger's historical definition, not verified-only. */
public record ProfileStatistics(long studyStreak, long bestStudyStreak,
                                BigDecimal verifiedMinutes, long verifiedSessions, long activeGoals) {}
