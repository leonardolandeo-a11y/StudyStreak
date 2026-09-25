package com.example.studystreak.service;

import com.example.studystreak.dto.Goal.GoalRequestDTO;
import com.example.studystreak.dto.Goal.GoalResponseDTO;
import com.example.studystreak.event.GoalCompletedEvent;
import com.example.studystreak.exceptions.ForbiddenException;
import com.example.studystreak.exceptions.ResourceNotFoundException;
import com.example.studystreak.model.Goal;
import com.example.studystreak.model.User;
import com.example.studystreak.repository.GoalRepository;
import com.example.studystreak.repository.UserRepository;

import org.modelmapper.ModelMapper;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GoalService {

    private final GoalRepository goalRepository;
    private final ModelMapper modelMapper;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;
    private final ApplicationEventPublisher eventPublisher;

    public GoalService(
            GoalRepository goalRepository,
            ModelMapper modelMapper,
            UserRepository userRepository,
            CurrentUserService currentUserService,
            ApplicationEventPublisher eventPublisher
    ) {
        this.goalRepository = goalRepository;
        this.modelMapper = modelMapper;
        this.userRepository = userRepository;
        this.currentUserService = currentUserService;
        this.eventPublisher = eventPublisher;
    }

    private void validateCurrentUser(Long userId) {

        Long currentUserId = currentUserService.getCurrentUserId();

        if (!currentUserId.equals(userId)) {
            throw new ForbiddenException(
                    "You cannot access resources of another user"
            );
        }
    }

    private Goal getOwnedGoal(Long goalId) {

        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Goal not found with id: " + goalId
                        )
                );

        Long currentUserId = currentUserService.getCurrentUserId();

        if (!goal.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException("You cannot access goal with id: " + goalId);
        }

        return goal;
    }

    @Transactional
    public GoalResponseDTO createGoal(Long userId, GoalRequestDTO goalDTO) {

        validateCurrentUser(userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found with id: " + userId
                        )
                );

        Goal goal = modelMapper.map(goalDTO, Goal.class);

        goal.setUser(user);

        Goal savedGoal = goalRepository.save(goal);

        return modelMapper.map(savedGoal, GoalResponseDTO.class);
    }

    public Page<GoalResponseDTO> getUserGoals(Long userId, Pageable pageable) {

        validateCurrentUser(userId);

        return goalRepository.findByUserId(userId, pageable).map(goal -> modelMapper.map(goal, GoalResponseDTO.class));
    }

    public GoalResponseDTO getGoalById(Long goalId) {

        Goal goal = getOwnedGoal(goalId);

        return modelMapper.map(goal, GoalResponseDTO.class);
    }
    @Transactional
    public GoalResponseDTO updateGoal(Long goalId, GoalRequestDTO goalDTO) {

        Goal goal = getOwnedGoal(goalId);

        boolean wasCompleted = Boolean.TRUE.equals(goal.getCompleted());

        goal.setTopic(goalDTO.getTopic());
        goal.setFrequency(goalDTO.getFrequency());
        goal.setDuration(goalDTO.getDuration());
        goal.setCompleted(goalDTO.getCompleted());

        boolean isCompleted = Boolean.TRUE.equals(
                goal.getCompleted()
        );

        Goal updatedGoal = goalRepository.save(goal);

        if (!wasCompleted && isCompleted) {

            eventPublisher.publishEvent(
                    new GoalCompletedEvent(updatedGoal.getId(), updatedGoal.getUser().getId())
            );
        }

        return modelMapper.map(updatedGoal, GoalResponseDTO.class);
    }
    @Transactional
    public void deleteGoal(Long goalId) {

        Goal goal = getOwnedGoal(goalId);

        goalRepository.delete(goal);
    }
}