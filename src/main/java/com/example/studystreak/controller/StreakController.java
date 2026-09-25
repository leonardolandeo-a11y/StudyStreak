package com.example.studystreak.controller;

import com.example.studystreak.dto.Streak.StreakDTO;
import com.example.studystreak.service.StreakService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/goals/{goalId}/streak")
public class StreakController {

    private final StreakService streakService;

    public StreakController(StreakService streakService){
        this.streakService = streakService;
    }

    @GetMapping
    public ResponseEntity<StreakDTO> getGoalStreak(@PathVariable Long goalId) {

        StreakDTO streak = streakService.getGoalStreak(goalId);

        return ResponseEntity.ok(streak);
    }

    @PutMapping("/recalculate")
    public ResponseEntity<StreakDTO> recalculateStreak(@PathVariable Long goalId){

        StreakDTO streak = streakService.recalculateStreak(goalId);

        return ResponseEntity.ok(streak);
    }
}