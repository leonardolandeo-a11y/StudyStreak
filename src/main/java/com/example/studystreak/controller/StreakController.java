package com.example.studystreak.controller;

import com.example.studystreak.dto.Streak.StreakDTO;
import com.example.studystreak.service.StreakService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
     * Este endpoint queda restringido a ADMIN.
     * El recálculo interno no necesita comprobar
     * ownership porque el administrador puede
     * recalcular cualquier Goal.
     */
    @PostMapping("/recalculate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StreakDTO> recalculateStreak(
            @PathVariable Long goalId
    ) {

        StreakDTO streak =
                streakService
                        .recalculateStreak(goalId);

        return ResponseEntity.ok(streak);
    }
}