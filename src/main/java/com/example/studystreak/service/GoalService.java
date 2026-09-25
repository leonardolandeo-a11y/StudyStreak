package com.example.studystreak.service;

import com.example.studystreak.dto.Goal.GoalRequestDTO;
import com.example.studystreak.dto.Goal.GoalResponseDTO;
import com.example.studystreak.exceptions.ResourceNotFoundException;
import com.example.studystreak.model.Goal;
import com.example.studystreak.model.User;
import com.example.studystreak.repository.GoalRepository;
import com.example.studystreak.repository.UserRepository;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;


@Service
public class GoalService {
    private final GoalRepository goalRepository;
    private final ModelMapper modelMapper;
    private final UserRepository userRepository;

    public GoalService(GoalRepository goalRepository, ModelMapper modelMapper, UserRepository userRepository) {
        this.goalRepository = goalRepository;
        this.modelMapper = modelMapper;
        this.userRepository = userRepository;
    }

    public GoalResponseDTO createGoal(Long userId, GoalRequestDTO goalDTO) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Goal goal = modelMapper.map(goalDTO, Goal.class);
        goal.setUser(user);
        goal = goalRepository.save(goal);

        return modelMapper.map(goal, GoalResponseDTO.class);
    }

    public Page<GoalResponseDTO> getUserGoals(Long userId, Pageable pageable) {

        return goalRepository.findByUserId(userId, pageable)
                .map(goal -> modelMapper.map(goal, GoalResponseDTO.class));
    }

    public GoalResponseDTO getGoalById(Long goalId) {

        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found with id: " + goalId));

        return modelMapper.map(goal, GoalResponseDTO.class);
    }

    public GoalResponseDTO updateGoal(Long goalId, GoalRequestDTO goalDTO) {
        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found with id: " + goalId));

        goal.setTopic(goalDTO.getTopic());
        goal.setFrequency(goalDTO.getFrequency());
        goal.setDuration(goalDTO.getDuration());
        Goal updatedGoal = goalRepository.save(goal);
        return modelMapper.map(updatedGoal, GoalResponseDTO.class);

    }

    public void deleteGoal(Long goalId) {
        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found with id: " + goalId));

        goalRepository.delete(goal);
    }

}
