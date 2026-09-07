package com.example.studystreak.service;

import org.springframework.stereotype.Service;

@Service
public class GoalService {
    private final GoalService goalService;

    public GoalService(GoalService goalService) {
        this.goalService = goalService;
    }
}
