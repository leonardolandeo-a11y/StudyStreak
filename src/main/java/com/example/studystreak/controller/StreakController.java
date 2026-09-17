package com.example.studystreak.controller;

import com.example.studystreak.dto.Streak.StreakDTO;
import com.example.studystreak.service.StreakService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/goals/{goalId}/streak")
public class StreakController {
    private final StreakService streakService;

    public StreakController(StreakService streakService){
        this.streakService = streakService;
    }

    @GetMapping
    public StreakDTO getGoalStreak(@PathVariable Long goalId){
        return streakService.getGoalStreak(goalId);
    }

    @PutMapping("/recalculate")
    public StreakDTO recalculateStreak(@PathVariable Long goalId){
        return streakService.recalculateStreak(goalId);
    }
}