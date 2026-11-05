package com.example.studystreak.service;

import com.example.studystreak.dto.Focus.FocusSessionRequestDTO;
import com.example.studystreak.dto.Focus.FocusSessionResponseDTO;
import com.example.studystreak.dto.Focus.FocusSummaryDTO;
import com.example.studystreak.exceptions.ForbiddenException;
import com.example.studystreak.exceptions.ResourceNotFoundException;
import com.example.studystreak.model.Goal;
import com.example.studystreak.repository.GoalRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;


@Service
public class FocusSessionService {
    private final CurrentUserService currentUserService;
    private final GoalRepository goalRepository;
    private final StudyLedgerService ledger;

    public FocusSessionService(
            CurrentUserService currentUserService,
            GoalRepository goalRepository,
            StudyLedgerService ledger
    ) {
        this.currentUserService = currentUserService;
        this.goalRepository = goalRepository;
        this.ledger = ledger;
    }

    private Goal ownedGoal(Long goalId) {
        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found"));
        if (!goal.getUser().getId().equals(currentUserService.getCurrentUserId())) {
            throw new ForbiddenException("Only the goal owner can access focus sessions");
        }
        return goal;
    }

    /**
     * Client-generated UUID makes a completed session idempotent across retries
     * and page reloads. Only its owner may add minutes.
     */
    @Transactional
    public FocusSessionResponseDTO recordCompletion(Long goalId, FocusSessionRequestDTO request) {
        ownedGoal(goalId);
        if (request.sessionId() == null || request.durationMinutes() == null
                || request.durationMinutes() < 5 || request.durationMinutes() > 120) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid focus session duration or id");
        }

        var saved = ledger.complete(goalId, request.sessionId(), request.durationMinutes());
        return new FocusSessionResponseDTO(request.sessionId(), goalId,
                ((Number)saved.get("confirmed_seconds")).intValue() / 60,
                ((java.sql.Timestamp)saved.get("completed_at")).toInstant());
    }

    @Transactional(readOnly = true)
    public FocusSummaryDTO summary(Long goalId) {
        ownedGoal(goalId);
        var totals = ledger.summary(goalId);
        return new FocusSummaryDTO(goalId, ((Number)totals.get("totalMinutes")).longValue(),
                ((Number)totals.get("completedSessions")).longValue());
    }
}
