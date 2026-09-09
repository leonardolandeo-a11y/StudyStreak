package com.example.studystreak.service;

import com.example.studystreak.dto.Goal.GoalDTO;
import com.example.studystreak.model.Goal;
import com.example.studystreak.model.User;
import com.example.studystreak.repository.GoalRepository;
import com.example.studystreak.repository.UserRepository;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

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

    public GoalDTO createGoal(Long userId, GoalDTO goalDTO){
        User user = userRepository.findById(userId).orElseThrow(); // Exception (No implemented yet)
        Goal goal = modelMapper.map(goalDTO, Goal.class);

        goal.setUser(user);

        goal = goalRepository.save(goal);

        return modelMapper.map(goal, GoalDTO.class);
    }

    public List<GoalDTO> getUserGoals(Long userId){
        List<Goal> goals = goalRepository.findByUserId(userId);

        List<GoalDTO> goalsDTO = new ArrayList<>();
        for (int i =0; i < goals.size();i++){
            goalsDTO.add(modelMapper.map(goals.get(i), GoalDTO.class));
        }
        return goalsDTO;
    }
    public GoalDTO updateGoal(Long goalId, GoalDTO goalDTO){
        Goal goal = goalRepository.findById(goalId).orElseThrow(); // Exception (No implemented yet)
        goal.setFrequency(goalDTO.getFrequency());
        goal.setTopic(goalDTO.getTopic());
        goal.setDuration(goalDTO.getDuration());
        goalRepository.save(goal);
        return modelMapper.map(goal , GoalDTO.class);

    }
    public void deleteGoal(Long goalId){
        Goal goal = goalRepository.findById(goalId).orElseThrow(); // Exception (No implemented yet)
        goalRepository.delete(goal);
    }

}
