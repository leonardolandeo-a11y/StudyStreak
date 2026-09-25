package com.example.studystreak.controller;

import com.example.studystreak.dto.Goal.GoalRequestDTO;
import com.example.studystreak.dto.Goal.GoalResponseDTO;
import com.example.studystreak.service.GoalService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/users/{userId}/goals")
public class GoalController {

    private final GoalService goalService;

    public GoalController(GoalService goalService) {
        this.goalService = goalService;
    }

    /*
     * TODO Issue Security:
     * reemplazar X-User-Id por SecurityContext.
     */
    private void validateUserAccess(Long pathUserId, Long headerUserId) {

        if (!pathUserId.equals(headerUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado");
        }
    }

    @GetMapping
    public ResponseEntity<List<GoalResponseDTO>> getUserGoals(@PathVariable Long userId,
                                                              @RequestHeader("X-User-Id") Long currentUserId) {

        validateUserAccess(userId, currentUserId);
        List<GoalResponseDTO> goals = goalService.getUserGoals(userId);

        return ResponseEntity.ok(goals);
    }

    @GetMapping("/{goalId}")
    public ResponseEntity<GoalResponseDTO> getGoal(@PathVariable Long userId, @PathVariable Long goalId,
            @RequestHeader("X-User-Id") Long currentUserId) {

        validateUserAccess(userId, currentUserId);
        GoalResponseDTO goal = goalService.getGoalById(goalId);
        return ResponseEntity.ok(goal);
    }

    @PostMapping
    public ResponseEntity<GoalResponseDTO> createGoal(@PathVariable Long userId, @RequestBody GoalRequestDTO goalDTO,
                                                      @RequestHeader("X-User-Id") Long currentUserId) {

        validateUserAccess(userId, currentUserId);
        GoalResponseDTO savedGoal = goalService.createGoal(userId, goalDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedGoal);
    }

    @PutMapping("/{goalId}")
    public ResponseEntity<GoalResponseDTO> updateGoal(@PathVariable Long userId, @PathVariable Long goalId,
            @RequestBody GoalRequestDTO goalDTO, @RequestHeader("X-User-Id") Long currentUserId) {

        validateUserAccess(userId, currentUserId);
        GoalResponseDTO updatedGoal = goalService.updateGoal(goalId, goalDTO);
        return ResponseEntity.ok(updatedGoal);
    }

    @DeleteMapping("/{goalId}")
    public ResponseEntity<Void> deleteGoal(@PathVariable Long userId, @PathVariable Long goalId,
            @RequestHeader("X-User-Id") Long currentUserId) {

        validateUserAccess(userId, currentUserId);
        goalService.deleteGoal(goalId);
        return ResponseEntity.noContent().build();
    }
}