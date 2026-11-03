package com.example.studystreak.service;

import com.example.studystreak.dto.Focus.FocusSessionRequestDTO;
import com.example.studystreak.dto.Focus.FocusSessionResponseDTO;
import com.example.studystreak.dto.Focus.FocusSummaryDTO;
import com.example.studystreak.exceptions.ForbiddenException;
import com.example.studystreak.exceptions.ResourceNotFoundException;
import com.example.studystreak.model.FocusSession;
import com.example.studystreak.model.Goal;
import com.example.studystreak.repository.FocusSessionRepository;
import com.example.studystreak.repository.GoalRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;

@Service
public class FocusSessionService {
    private final CurrentUserService currentUserService;
    private final GoalRepository goalRepository;
    private final FocusSessionRepository focusSessionRepository;

    public FocusSessionService(
            CurrentUserService currentUserService,
            GoalRepository goalRepository,
            FocusSessionRepository focusSessionRepository
    ) {
        this.currentUserService = currentUserService;
        this.goalRepository = goalRepository;
        this.focusSessionRepository = focusSessionRepository;
    }

    private Goal ownedGoal(Long goalId) {
        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found"));
        if (!goal.getUser().getId().equals(currentUserService.getCurrentUserId())) {
            throw new ForbiddenException("Only the goal owner can access focus sessions");
        }
        return goal;
    }

    private FocusSessionResponseDTO toResponse(FocusSession session) {
        return new FocusSessionResponseDTO(
                session.getId(), session.getGoal().getId(),
                session.getDurationMinutes(), session.getCompletedAt()
        );
    }

    /**
     * Client-generated UUID makes a completed session idempotent across retries
     * and page reloads. Only its owner may add minutes.
     */
    @Transactional
    public FocusSessionResponseDTO recordCompletion(Long goalId, FocusSessionRequestDTO request) {
        Goal goal = ownedGoal(goalId);
        if (request.sessionId() == null || request.durationMinutes() == null
                || request.durationMinutes() < 5 || request.durationMinutes() > 120) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid focus session duration or id");
        }

        // PostgreSQL arbitrates concurrent retries before reading the winner.
        // Never merge a client UUID: merge can overwrite another completion in a race.
        focusSessionRepository.insertIfAbsent(request.sessionId(), goal.getId(),
                request.durationMinutes(), Instant.now());
        FocusSession existing = focusSessionRepository.findById(request.sessionId()).orElseThrow();
        if (!existing.getGoal().getId().equals(goalId)
                || !existing.getDurationMinutes().equals(request.durationMinutes())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This session id already belongs to another completion");
        }
        return toResponse(existing);
    }

    @Transactional(readOnly = true)
    public FocusSummaryDTO summary(Long goalId) {
        ownedGoal(goalId);
        return new FocusSummaryDTO(goalId, focusSessionRepository.sumMinutesByGoalId(goalId),
                focusSessionRepository.countByGoalId(goalId));
    }
}
