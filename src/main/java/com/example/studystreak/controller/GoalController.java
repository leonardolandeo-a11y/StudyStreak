package com.example.studystreak.controller;

import com.example.studystreak.dto.Goal.GoalDTO;
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

    //inyeccion
    public GoalController(GoalService goalService) {
        this.goalService = goalService;
    }

    /*
    funcion auxiliar para validar usuarios (seria bueno modificar laa estructura de los endpoints para
    no depender de estas cosas)
     */
    private void validateUserAccess(Long pathUserId, Long headerUserId) {
        if (!pathUserId.equals(headerUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado");
        }
    }

    //get
    @GetMapping
    public ResponseEntity<List<GoalDTO>> getUserGoals(
            @PathVariable Long userId,
            @RequestHeader("X-User-Id") Long currentUserId) {

        validateUserAccess(userId, currentUserId);

        List<GoalDTO> userGoals = goalService.getUserGoals(userId); //corregir

        return ResponseEntity.ok(userGoals);
    }

    //post
    @PostMapping
    public ResponseEntity<GoalDTO> createGoal(
            @PathVariable Long userId,
            @RequestBody GoalDTO goalDTO,
            @RequestHeader("X-User-Id") Long currentUserId) {

        validateUserAccess(userId, currentUserId);

        GoalDTO savedGoal = goalService.createGoal(userId, goalDTO);

        return ResponseEntity.status(HttpStatus.CREATED).body(savedGoal);
    }

    // path/put
    @PutMapping("/{goalId}")
    public ResponseEntity<GoalDTO> updateGoal(
            @PathVariable Long userId,
            @PathVariable Long goalId,
            @RequestBody GoalDTO goalDTO,
            @RequestHeader("X-User-Id") Long currentUserId) {

        validateUserAccess(userId, currentUserId);

        GoalDTO updatedGoal = goalService.updateGoal(goalId, goalDTO);

        return ResponseEntity.ok(updatedGoal);
    }

    //delete
    @DeleteMapping("/{goalId}")
    public ResponseEntity<Void> deleteGoal(
            @PathVariable Long userId,
            @PathVariable Long goalId,
            @RequestHeader("X-User-Id") Long currentUserId) {

        validateUserAccess(userId, currentUserId);

        goalService.deleteGoal(goalId);

        return ResponseEntity.noContent().build();
    }
}