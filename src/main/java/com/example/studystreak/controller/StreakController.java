package com.example.studystreak.controller;

import com.example.studystreak.dto.Streak.StreakDTO;
import com.example.studystreak.service.StreakService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/goals/{goalId}/streak")
public class StreakController {

    private final StreakService streakService;

    public StreakController(
            StreakService streakService
    ) {

        this.streakService = streakService;
    }


    /*
     * Consulta la racha del Goal.
     *
     * StreakService comprobará que el Goal
     * pertenezca al usuario autenticado.
     */
    @GetMapping
    public StreakDTO getGoalStreak(
            @PathVariable Long goalId
    ) {

        return streakService.getGoalStreak(goalId);
    }


    /*
     * Fuerza manualmente el recálculo.
     *
     * Usamos recalculateOwnedStreak()
     * porque este endpoint sí necesita comprobar
     * quién está haciendo la petición.
     */
    @PostMapping("/recalculate")
    public ResponseEntity<StreakDTO> recalculateStreak(
            @PathVariable Long goalId
    ) {

        StreakDTO streak =
                streakService
                        .recalculateOwnedStreak(goalId);

        return ResponseEntity.ok(streak);
    }
}