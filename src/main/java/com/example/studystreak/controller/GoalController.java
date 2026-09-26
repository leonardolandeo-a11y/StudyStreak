package com.example.studystreak.controller;


import com.example.studystreak.dto.Goal.GoalRequestDTO;
import com.example.studystreak.dto.Goal.GoalResponseDTO;
import com.example.studystreak.service.GoalService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.studystreak.exceptions.ForbiddenException;
import com.example.studystreak.service.CurrentUserService;

@RestController
@RequestMapping("/users/{userId}/goals")
public class GoalController {

    private final GoalService goalService;
    private final CurrentUserService currentUserService;

    public GoalController(GoalService goalService, CurrentUserService currentUserService) {

        this.goalService = goalService;
        this.currentUserService = currentUserService;
    }

    private void validateUserAccess(Long pathUserId) {

        Long currentUserId =
                currentUserService.getCurrentUserId();

        if (!pathUserId.equals(currentUserId)) {

            throw new ForbiddenException(
                    "You cannot access resources of another user"
            );
        }
    }

    @GetMapping
    public ResponseEntity<Page<GoalResponseDTO>> getUserGoals(@PathVariable Long userId, Pageable pageable) {

        validateUserAccess(userId);
        return ResponseEntity.ok(goalService.getUserGoals(userId, pageable));
    }

    @GetMapping("/{goalId}")
    public ResponseEntity<GoalResponseDTO> getGoal(@PathVariable Long userId, @PathVariable Long goalId) {

        validateUserAccess(userId);
        GoalResponseDTO goal = goalService.getGoalById(goalId);
        return ResponseEntity.ok(goal);
    }

    @PostMapping
    public ResponseEntity<GoalResponseDTO> createGoal(@PathVariable Long userId, @Valid @RequestBody GoalRequestDTO goalDTO) {

        validateUserAccess(userId);
        GoalResponseDTO savedGoal = goalService.createGoal(userId, goalDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedGoal);
    }

    @PutMapping("/{goalId}")
    public ResponseEntity<GoalResponseDTO> updateGoal(@PathVariable Long userId, @PathVariable Long goalId,
                                                      @Valid @RequestBody GoalRequestDTO goalDTO) {

        validateUserAccess(userId);
        GoalResponseDTO updatedGoal = goalService.updateGoal(goalId, goalDTO);
        return ResponseEntity.ok(updatedGoal);
    }

    @DeleteMapping("/{goalId}")
    public ResponseEntity<Void> deleteGoal(@PathVariable Long userId, @PathVariable Long goalId) {

        validateUserAccess(userId);
        goalService.deleteGoal(goalId);
        return ResponseEntity.noContent().build();
    }
}