package com.example.studystreak.service;

import com.example.studystreak.repository.StreakRepository;
import org.springframework.stereotype.Service;

@Service
public class StreakService {
    private final StreakRepository streakRepository;

    public StreakService(StreakRepository streakRepository) {
        this.streakRepository = streakRepository;
    }
}
