package com.example.studystreak.controller;

import com.example.studystreak.dto.Goal.GoalRequestDTO;
import com.example.studystreak.dto.Goal.GoalResponseDTO;
import com.example.studystreak.service.GoalService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
     * reemplazar X-User-Id por SecurityContext en el siguiente issue
     */
    private void validateUserAccess(Long pathUserId, Long headerUserId) {

        if (!pathUserId.equals(headerUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado");
        }
    }

    @GetMapping
    public ResponseEntity<Page<GoalResponseDTO>> getUserGoals(@PathVariable Long userId, @RequestHeader("X-User-Id") Long currentUserId,
            Pageable pageable) {

        validateUserAccess(userId, currentUserId);
        return ResponseEntity.ok(goalService.getUserGoals(userId, pageable));
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