package com.example.studystreak.service;

import com.example.studystreak.dto.Dashboard.GoalSummaryDTO;
import com.example.studystreak.dto.Dashboard.RecordSummaryDTO;
import com.example.studystreak.dto.Dashboard.StreakSummaryDTO;
import com.example.studystreak.dto.Dashboard.ValidationSummaryDTO;
import com.example.studystreak.model.User;
import com.example.studystreak.repository.DailyRecordRepository;
import com.example.studystreak.repository.GoalRepository;
import com.example.studystreak.repository.StreakRepository;
import com.example.studystreak.repository.ValidationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private final CurrentUserService currentUserService;
    private final GoalRepository goalRepository;
    private final StreakRepository streakRepository;
    private final DailyRecordRepository dailyRecordRepository;
    private final ValidationRepository validationRepository;
    private final StreakService streakService;

    public DashboardService(
            CurrentUserService currentUserService,
            GoalRepository goalRepository,
            StreakRepository streakRepository,
            DailyRecordRepository dailyRecordRepository,
            ValidationRepository validationRepository,
            StreakService streakService
    ) {
        this.currentUserService = currentUserService;
        this.goalRepository = goalRepository;
        this.streakRepository = streakRepository;
        this.dailyRecordRepository = dailyRecordRepository;
        this.validationRepository = validationRepository;
        this.streakService = streakService;
    }

    public GoalSummaryDTO getGoalSummary() {
        Long userId = currentUserService.getCurrentUserId();
        long total = goalRepository.countByUserId(userId);
        long completed = goalRepository.countByUserIdAndCompletedTrue(userId);
        return new GoalSummaryDTO(total - completed, completed);
    }

    @Transactional
    public StreakSummaryDTO getStreakSummary() {
        User user = currentUserService.getCurrentUser();
        Long userId = user.getId();
        LocalDate today = StudyDatePolicy.today(user);
        for (Long goalId : goalRepository.findGoalsWithOutdatedStreaks(userId, today)) {
            streakService.recalculateStreak(goalId);
        }
        return new StreakSummaryDTO(
                streakRepository.findHighestCurrentStreak(userId),
                streakRepository.findHighestBestStreak(userId)
        );
    }

    public RecordSummaryDTO getRecordSummary() {
        User user = currentUserService.getCurrentUser();
        LocalDate today = StudyDatePolicy.today(user);
        return new RecordSummaryDTO(
                dailyRecordRepository.countByGoal_User_IdAndDateBetween(
                        user.getId(), today.minusDays(6), today
                )
        );
    }

    public ValidationSummaryDTO getValidationSummary() {
        Long userId = currentUserService.getCurrentUserId();
        return new ValidationSummaryDTO(
                validationRepository.countReviewedByRecordOwnerId(userId),
                dailyRecordRepository.countAwaitingReviewByUserId(userId)
        );
    }
}
